#!/usr/bin/env python3
"""
Prisma Schema Validator

Validates that a Prisma schema file is internally consistent and follows best practices.
This script can be used by Claude to validate schema changes before applying migrations.
"""

import re
import sys
from typing import Dict, List, Set, Tuple
from dataclasses import dataclass


@dataclass
class PrismaModel:
    """Represents a Prisma model."""
    name: str
    fields: List[Dict[str, str]]
    indexes: List[str]
    has_id: bool
    has_timestamps: bool


@dataclass
class ValidationIssue:
    """Represents a validation issue."""
    severity: str  # 'error', 'warning', 'info'
    model: str
    field: str
    message: str


class PrismaSchemaValidator:
    """Validates Prisma schema files."""

    def __init__(self, schema_content: str):
        self.schema_content = schema_content
        self.models: Dict[str, PrismaModel] = {}
        self.issues: List[ValidationIssue] = []

    def parse_schema(self) -> None:
        """Parse the Prisma schema and extract models."""
        # Find all model definitions
        model_pattern = r'model\s+(\w+)\s*\{([^}]+)\}'
        matches = re.finditer(model_pattern, self.schema_content, re.MULTILINE)

        for match in matches:
            model_name = match.group(1)
            model_body = match.group(2)

            fields = []
            indexes = []
            has_id = False
            has_timestamps = False

            # Parse fields
            field_lines = [line.strip() for line in model_body.split('\n') if line.strip()]

            for line in field_lines:
                # Skip comments and empty lines
                if line.startswith('//') or not line:
                    continue

                # Check for indexes
                if line.startswith('@@index'):
                    indexes.append(line)
                    continue

                # Parse field
                field_match = re.match(r'(\w+)\s+(\w+)(\??|\[\])?(.*)$', line)
                if field_match:
                    field_name = field_match.group(1)
                    field_type = field_match.group(2)
                    optional = field_match.group(3) or ''
                    attributes = field_match.group(4) or ''

                    fields.append({
                        'name': field_name,
                        'type': field_type,
                        'optional': '?' in optional,
                        'array': '[]' in optional,
                        'attributes': attributes
                    })

                    # Check for ID field
                    if '@id' in attributes or field_name.lower() == 'id':
                        has_id = True

                    # Check for timestamps
                    if field_name in ['createdAt', 'updatedAt', 'created_at', 'updated_at']:
                        has_timestamps = True

            self.models[model_name] = PrismaModel(
                name=model_name,
                fields=fields,
                indexes=indexes,
                has_id=has_id,
                has_timestamps=has_timestamps
            )

    def validate(self) -> List[ValidationIssue]:
        """Run all validation checks."""
        self.parse_schema()

        # Run validation checks
        self.check_id_fields()
        self.check_timestamps()
        self.check_relations()
        self.check_indexes_on_relations()
        self.check_naming_conventions()
        self.check_enum_usage()

        return self.issues

    def check_id_fields(self) -> None:
        """Check that all models have an ID field."""
        for model in self.models.values():
            if not model.has_id:
                self.issues.append(ValidationIssue(
                    severity='error',
                    model=model.name,
                    field='',
                    message='Model is missing an @id field'
                ))

    def check_timestamps(self) -> None:
        """Check for timestamp fields."""
        for model in self.models.values():
            if not model.has_timestamps:
                self.issues.append(ValidationIssue(
                    severity='warning',
                    model=model.name,
                    field='',
                    message='Consider adding createdAt and updatedAt timestamp fields'
                ))

    def check_relations(self) -> None:
        """Validate that relations reference existing models."""
        for model in self.models.values():
            for field in model.fields:
                # Check if field type is another model
                if field['type'] in self.models:
                    # This is a relation field
                    if '@relation' not in field['attributes']:
                        self.issues.append(ValidationIssue(
                            severity='info',
                            model=model.name,
                            field=field['name'],
                            message=f'Relation to {field["type"]} should include @relation attribute'
                        ))
                elif field['type'] not in ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Bytes']:
                    # Might be an undefined model reference
                    if field['type'][0].isupper():  # Capitalized = likely model name
                        self.issues.append(ValidationIssue(
                            severity='error',
                            model=model.name,
                            field=field['name'],
                            message=f'References undefined model: {field["type"]}'
                        ))

    def check_indexes_on_relations(self) -> None:
        """Check that foreign key fields have indexes."""
        for model in self.models.values():
            relation_fields = []

            for field in model.fields:
                # Look for relation attributes that specify foreign key fields
                if '@relation' in field['attributes']:
                    # Extract fields from @relation(fields: [field1, field2])
                    fields_match = re.search(r'fields:\s*\[([^\]]+)\]', field['attributes'])
                    if fields_match:
                        fk_fields = [f.strip() for f in fields_match.group(1).split(',')]
                        relation_fields.extend(fk_fields)

            # Check if these fields are indexed
            indexed_fields = set()
            for index in model.indexes:
                # Extract fields from @@index([field1, field2])
                fields_match = re.search(r'@@index\(\[([^\]]+)\]', index)
                if fields_match:
                    idx_fields = [f.strip() for f in fields_match.group(1).split(',')]
                    indexed_fields.update(idx_fields)

            for fk_field in relation_fields:
                if fk_field not in indexed_fields:
                    self.issues.append(ValidationIssue(
                        severity='warning',
                        model=model.name,
                        field=fk_field,
                        message=f'Foreign key field should have an index for query performance'
                    ))

    def check_naming_conventions(self) -> None:
        """Check naming conventions."""
        for model in self.models.values():
            # Model names should be PascalCase
            if not model.name[0].isupper():
                self.issues.append(ValidationIssue(
                    severity='warning',
                    model=model.name,
                    field='',
                    message='Model name should start with uppercase (PascalCase)'
                ))

            # Field names should be camelCase
            for field in model.fields:
                if '_' in field['name'] and field['name'] not in ['created_at', 'updated_at']:
                    self.issues.append(ValidationIssue(
                        severity='info',
                        model=model.name,
                        field=field['name'],
                        message='Consider using camelCase instead of snake_case for field names'
                    ))

    def check_enum_usage(self) -> None:
        """Check for fields that might benefit from enums."""
        status_keywords = ['status', 'state', 'type', 'role', 'kind', 'category']

        for model in self.models.values():
            for field in model.fields:
                if field['type'] == 'String':
                    # Check if field name suggests it should be an enum
                    if any(keyword in field['name'].lower() for keyword in status_keywords):
                        self.issues.append(ValidationIssue(
                            severity='info',
                            model=model.name,
                            field=field['name'],
                            message='Consider using an enum type for this field instead of String'
                        ))

    def generate_report(self) -> str:
        """Generate a human-readable validation report."""
        if not self.issues:
            return "✓ Schema validation passed with no issues"

        report = []
        report.append(f"Schema Validation Report: {len(self.issues)} issue(s) found\n")

        # Group by severity
        errors = [i for i in self.issues if i.severity == 'error']
        warnings = [i for i in self.issues if i.severity == 'warning']
        info = [i for i in self.issues if i.severity == 'info']

        if errors:
            report.append("ERRORS:")
            for issue in errors:
                field_info = f".{issue.field}" if issue.field else ""
                report.append(f"  ✗ {issue.model}{field_info}: {issue.message}")
            report.append("")

        if warnings:
            report.append("WARNINGS:")
            for issue in warnings:
                field_info = f".{issue.field}" if issue.field else ""
                report.append(f"  ⚠ {issue.model}{field_info}: {issue.message}")
            report.append("")

        if info:
            report.append("SUGGESTIONS:")
            for issue in info:
                field_info = f".{issue.field}" if issue.field else ""
                report.append(f"  ℹ {issue.model}{field_info}: {issue.message}")

        return "\n".join(report)


def main():
    """Main entry point for CLI usage."""
    if len(sys.argv) < 2:
        print("Usage: python validate_schema.py <path-to-schema.prisma>")
        sys.exit(1)

    schema_path = sys.argv[1]

    try:
        with open(schema_path, 'r') as f:
            schema_content = f.read()
    except FileNotFoundError:
        print(f"Error: File not found: {schema_path}")
        sys.exit(1)

    validator = PrismaSchemaValidator(schema_content)
    validator.validate()

    print(validator.generate_report())

    # Exit with error code if there are errors
    has_errors = any(i.severity == 'error' for i in validator.issues)
    sys.exit(1 if has_errors else 0)


if __name__ == '__main__':
    main()
