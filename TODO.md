# TODO: Fix login authentication and protect all routes with JWT

## Steps:
- [x] Step 1: Fix auth.py - proper login with OAuth2Form/LoginRequest, clinic_id=1, services.authenticate_user\n- [x] Step 2: Update security.py - create_access_token with role/clinic_id, use settings.SECRET_KEY\n
- [ ] Step 3: Ensure register works with services.create_user
- [ ] Step 4: Verify deps.py protection on all endpoints (add if missing)
- [ ] Step 5: Test server startup and login endpoint
- [ ] Step 6: Complete task

