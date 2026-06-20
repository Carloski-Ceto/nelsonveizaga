from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.test import SimpleTestCase


class PasswordPolicyTests(SimpleTestCase):
    def test_accepts_alphanumeric_with_upper_lower_digit(self):
        validate_password("R4ndomXa")

    def test_rejects_symbol_characters(self):
        with self.assertRaises(ValidationError):
            validate_password("Abcd1234!")

    def test_rejects_spaces(self):
        with self.assertRaises(ValidationError):
            validate_password("Abcd 1234")

    def test_rejects_missing_uppercase(self):
        with self.assertRaises(ValidationError):
            validate_password("abcd1234")

    def test_rejects_missing_lowercase(self):
        with self.assertRaises(ValidationError):
            validate_password("ABCD1234")

    def test_rejects_missing_digit(self):
        with self.assertRaises(ValidationError):
            validate_password("Abcdefgh")
