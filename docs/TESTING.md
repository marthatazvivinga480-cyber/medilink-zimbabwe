# Manual test checklist

1. Start MongoDB.
2. Run `npm run seed` in `server`.
3. Start server.
4. Start client.
5. Log in as the demo patient.
6. Open Doctors.
7. Open Dr. Tendai Moyo.
8. Select tomorrow's date and a time slot.
9. Book the appointment.
10. Confirm it appears in the patient dashboard.
11. Log out.
12. Log in as the demo doctor.
13. Confirm the appointment appears.
14. Select it and save a consultation.
15. Log in as patient again.
16. Confirm diagnosis/record appears.
17. Confirm prescription appears.
18. Open Verification and verify `RX-MZ-2026-009812`.
19. Try booking the same slot again. The API should reject it.
20. Try opening patient-only endpoints without a token. They should return 401.
