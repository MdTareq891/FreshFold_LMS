FreshFold Manual Test Cases

1. Backend health

TC-01: Backend is running
- Status: Passed
- Method: GET
- URL: http://localhost:4000/api/health
- Input: none
- Expected result: HTTP 200 and a response with ok=true
- Actual result:
  {
    "ok": true,
    "service": "Laundry Management System API"
  }

2. Registration

TC-02: Customer registration through API
- Status: Passed
- Method: POST
- URL: http://localhost:4000/api/auth/register
- Input:
  {
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "TestPass123!",
    "phone": "1234567890",
    "address": "Dhaka"
  }
- Expected result: HTTP 201 with a token and user details
- Actual result:
  {
    "token": "<JWT token>",
    "user": {
      "name": "Test User",
      "email": "testuser@example.com",
      "role": "customer",
      "phone": "1234567890",
      "address": "Dhaka",
      "language": "en",
      "id": "6aa6df8c39fc789da1981412"
    }
  }

TC-03: Customer registration through the browser
- Status: Passed
- URL: http://localhost:5174/register
- Input:
  - Full name: Browser Test
  - Email: browser_1789321252021@example.com
  - Password: Pass123456!
  - Phone: 123456789
  - Address: Dhaka
- Steps:
  1. Open the registration page.
  2. Fill in the details.
  3. Click Create account.
- Expected result: User is redirected to the customer dashboard.
- Actual result: Redirected to http://localhost:5174/customer and the page loaded successfully.

3. Admin login

TC-04: Admin login
- Status: Passed
- Email: admin@freshfold.com
- Password: Admin123456!
- Expected result: Login succeeds and admin dashboard loads.
- Actual result: The admin account is configured and working in the project.

4. Issue found and fixed

TC-05: CORS and port conflict during registration
- Status: Passed
- Problem: Registration failed in the browser because the backend was not reachable and CORS blocked the request.
- Cause:
  - an old Node process was still holding port 4000
  - the CORS settings were too strict for the frontend port
- Fix:
  - old processes were cleared
  - CORS was updated to allow localhost ports 5173 and 5174
- Result: Registration worked after the fix.

5. UI check

TC-06: Customer dashboard layout
- Status: Passed
- Check: remove the unwanted horizontal scroll
- Check: make the text under the progress dots easier to read
- Result: the layout was updated and the extra horizontal scroll is no longer forced.

TC-07: Customer login from browser
- Status: Passed
- URL: http://localhost:5174/login
- Input:
  - Email: admin@freshfold.com
  - Password: Admin123456!
- Steps:
  1. Open the login page.
  2. Enter admin credentials.
  3. Click Sign in.
- Expected result: User is redirected to the admin dashboard.
- Actual result: Login works successfully.

TC-08: Customer order placement flow
- Status: Passed
- URL: http://localhost:5174/customer
- Input:
  - Select a service item
  - Enter pickup date
  - Enter address
  - Optional note and photo
- Steps:
  1. Log in as a customer.
  2. Choose at least one service.
  3. Fill pickup details.
  4. Click Place order.
- Expected result: Order is created and shown in My Orders.
- Actual result: Order flow works and order appears in the customer dashboard.

TC-09: Navigation between tabs
- Status: Passed
- URL: http://localhost:5174/customer
- Steps:
  1. Click New Order.
  2. Click My Orders.
  3. Click Notifications.
- Expected result: Tabs switch correctly without broken layout.
- Actual result: Navigation works as expected.

6. Notes
- Start the backend before testing the frontend.
- If port 4000 is blocked, restart the backend.
- The frontend is usually available at http://localhost:5174.
