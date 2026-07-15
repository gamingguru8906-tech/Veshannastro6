import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import wallet


class PaymentVerificationTests(unittest.TestCase):
    def verify(self, payment):
        body = wallet.VerifyPaymentBody(
            payment_id="pay_Test123",
            expected_amount_paise=14900,
            currency="INR",
        )
        with (
            mock.patch.object(wallet, "RAZORPAY_KEY_ID", "rzp_test"),
            mock.patch.object(wallet, "RAZORPAY_KEY_SECRET", "secret"),
            mock.patch.object(wallet, "_fetch_razorpay_payment", return_value=payment),
        ):
            return wallet.verify_payment(body)

    def test_accepts_exact_captured_payment(self):
        result = self.verify({"status": "captured", "amount": 14900, "currency": "INR"})
        self.assertTrue(result["verified"])
        self.assertEqual(result["amount_paise"], 14900)

    def test_rejects_authorized_but_uncaptured_payment(self):
        result = self.verify({"status": "authorized", "amount": 14900, "currency": "INR"})
        self.assertFalse(result["verified"])

    def test_rejects_amount_mismatch(self):
        result = self.verify({"status": "captured", "amount": 100, "currency": "INR"})
        self.assertFalse(result["verified"])

    def test_rejects_invalid_payment_id_without_fetching(self):
        body = wallet.VerifyPaymentBody(payment_id="not-a-payment", expected_amount_paise=14900)
        with self.assertRaises(wallet.HTTPException) as error:
            wallet.verify_payment(body)
        self.assertEqual(error.exception.status_code, 400)


if __name__ == "__main__":
    unittest.main()
