import unittest

import wallet


class MaayaEventTests(unittest.TestCase):
    def test_hidden_lead_event_is_removed_and_parsed(self):
        raw = (
            "You are in safe hands.\n"
            "[[MAAYA_EVENT]]\n"
            '{"event":"LEAD_ESCALATION","priority":"HIGH","lead_data":'
            '{"name":"Amit","phone":"9810012345","email":"amit@example.com",'
            '"summary":"Tracking issue"}}\n'
            "[[/MAAYA_EVENT]]"
        )
        reply, event = wallet._extract_maaya_event(raw)
        self.assertEqual(reply, "You are in safe hands.")
        self.assertEqual(event["event"], "LEAD_ESCALATION")
        self.assertEqual(event["lead_data"]["email"], "amit@example.com")

    def test_invalid_event_is_not_promoted(self):
        reply, event = wallet._extract_maaya_event(
            "Hello [[MAAYA_EVENT]]{bad json}[[/MAAYA_EVENT]]"
        )
        self.assertEqual(reply, "Hello")
        self.assertIsNone(event)

    def test_incomplete_event_is_not_promoted(self):
        reply, event = wallet._extract_maaya_event(
            'Thanks [[MAAYA_EVENT]]{"event":"LEAD_ESCALATION",'
            '"lead_data":{"name":"Amit","phone":"","email":"a@example.com",'
            '"summary":"Callback"}}[[/MAAYA_EVENT]]'
        )
        self.assertEqual(reply, "Thanks")
        self.assertIsNone(event)

    def test_history_sanitizer_keeps_structured_events(self):
        event = {"event": "LEAD_ESCALATION", "lead_data": {"name": "A"}}
        history = wallet._sanitize_maaya_history([
            {"role": "system", "content": "ignore"},
            {"role": "user", "content": "  hello  "},
            {"role": "assistant", "content": "done", "event": event},
        ])
        self.assertEqual(history[0], {"role": "user", "content": "hello"})
        self.assertEqual(history[1]["event"], event)


if __name__ == "__main__":
    unittest.main()
