from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from typing import Iterable, Sequence


TABLE_PREFIX = "Banners"
DEFAULT_PROFILES = ("Dev", "Prod")
DEFAULT_CONTAINER = "banner"
DEFAULT_METHODS = ("DELETE", "GET", "HEAD", "MERGE", "OPTIONS", "POST", "PUT")
AZ_CLI = shutil.which("az") or shutil.which("az.cmd") or "az"


def build_table_name(profile: str) -> str:
    normalized = profile.strip().capitalize()
    if normalized not in DEFAULT_PROFILES:
        raise ValueError(f"Unsupported profile: {profile}")
    return f"{TABLE_PREFIX}{normalized}"


def run_az(args: Sequence[str], expect_json: bool = True):
    command = [AZ_CLI, *args]
    if expect_json:
        command.extend(["--output", "json"])

    result = subprocess.run(
        command,
        check=True,
        capture_output=True,
        text=True,
    )

    if not expect_json:
        return result.stdout.strip()

    output = result.stdout.strip() or "{}"
    return json.loads(output)


def ensure_cli_available() -> None:
    if shutil.which("az") is None and shutil.which("az.cmd") is None:
        raise RuntimeError("Azure CLI 'az' is required but was not found in PATH.")


def ensure_table(account_name: str, account_key: str, table_name: str) -> None:
    run_az(
        [
            "storage",
            "table",
            "create",
            "--account-name",
            account_name,
            "--account-key",
            account_key,
            "--name",
            table_name,
        ]
    )


def ensure_blob_container(
    account_name: str, account_key: str, container_name: str
) -> None:
    run_az(
        [
            "storage",
            "container",
            "create",
            "--account-name",
            account_name,
            "--account-key",
            account_key,
            "--name",
            container_name,
        ]
    )


def ensure_cors_rule(
    account_name: str,
    account_key: str,
    service_code: str,
    origins: Iterable[str],
    methods: Iterable[str],
) -> None:
    desired_origins = sorted(set(origins))
    desired_methods = sorted(set(methods))
    rules = run_az(
        [
            "storage",
            "cors",
            "list",
            "--services",
            service_code,
            "--account-name",
            account_name,
            "--account-key",
            account_key,
        ]
    )

    for rule in rules:
        raw_origins = rule.get("allowedOrigins") or rule.get("AllowedOrigins") or []
        raw_methods = rule.get("allowedMethods") or rule.get("AllowedMethods") or []
        current_origins = sorted(
            raw_origins.split(", ") if isinstance(raw_origins, str) else raw_origins
        )
        current_methods = sorted(
            raw_methods.split(", ") if isinstance(raw_methods, str) else raw_methods
        )
        if current_origins == desired_origins and current_methods == desired_methods:
            return

    run_az(
        [
            "storage",
            "cors",
            "add",
            "--services",
            service_code,
            "--account-name",
            account_name,
            "--account-key",
            account_key,
            "--origins",
            *desired_origins,
            "--methods",
            *desired_methods,
            "--allowed-headers",
            "*",
            "--exposed-headers",
            "*",
            "--max-age",
            "3600",
        ],
        expect_json=False,
    )


def validate_resources(
    account_name: str,
    account_key: str,
    table_names: Sequence[str],
    container_name: str,
) -> dict[str, object]:
    tables = run_az(
        [
            "storage",
            "table",
            "list",
            "--account-name",
            account_name,
            "--account-key",
            account_key,
        ]
    )
    available_table_names = sorted(item["name"] for item in tables)

    container = run_az(
        [
            "storage",
            "container",
            "show",
            "--account-name",
            account_name,
            "--account-key",
            account_key,
            "--name",
            container_name,
        ]
    )

    blob_cors = run_az(
        [
            "storage",
            "cors",
            "list",
            "--services",
            "b",
            "--account-name",
            account_name,
            "--account-key",
            account_key,
        ]
    )
    table_cors = run_az(
        [
            "storage",
            "cors",
            "list",
            "--services",
            "t",
            "--account-name",
            account_name,
            "--account-key",
            account_key,
        ]
    )

    return {
        "storageAccountName": account_name,
        "tables": {name: name in available_table_names for name in table_names},
        "container": {
            "name": container_name,
            "exists": bool(container.get("name") == container_name),
        },
        "cors": {
            "blobRules": len(blob_cors),
            "tableRules": len(table_cors),
        },
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Provision LocalM Banners Azure resources and CORS rules.",
    )
    parser.add_argument("--account-name", default="satutslocalm")
    parser.add_argument(
        "--account-key",
        default=os.environ.get("BANNER_TEST_ACCESS_KEY", ""),
    )
    parser.add_argument("--container", default=DEFAULT_CONTAINER)
    parser.add_argument(
        "--profiles",
        nargs="+",
        default=list(DEFAULT_PROFILES),
        help="Profiles to provision, e.g. Dev Prod",
    )
    parser.add_argument(
        "--origins",
        nargs="+",
        default=["*"],
        help="Origins to allow for blob and table CORS",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.account_key:
        print("BANNER_TEST_ACCESS_KEY is required.", file=sys.stderr)
        return 1

    ensure_cli_available()

    table_names = [build_table_name(profile) for profile in args.profiles]
    for table_name in table_names:
        ensure_table(args.account_name, args.account_key, table_name)

    ensure_blob_container(args.account_name, args.account_key, args.container)
    ensure_cors_rule(
        args.account_name, args.account_key, "b", args.origins, DEFAULT_METHODS
    )
    ensure_cors_rule(
        args.account_name, args.account_key, "t", args.origins, DEFAULT_METHODS
    )

    summary = validate_resources(
        args.account_name,
        args.account_key,
        table_names,
        args.container,
    )
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
