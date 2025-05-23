# Ticket Booking App

A Node.js Express-based API for railway ticket booking, supporting confirmed berths, RAC (Reservation Against Cancellation), and waiting list logic with real-world constraints.

---

## Features

- Book tickets for multiple passengers in a single request (PNR).
- Handles confirmed, RAC, and waiting list seat allocation.
- Automatic promotion of RAC and waiting list passengers on cancellation.
- Priority seat allocation for senior citizens and ladies with children.
- Children under 5 are stored but do not occupy a seat.
- Swagger API documentation (`/api-docs`).
- Robust concurrency handling with database transactions.

---

## Business Logic & Constraints

### Berth Allocation

- **Total Confirmed Berths:** 63 (LOWER, MIDDLE, UPPER only)
- **RAC Berths:** 9 SIDE_LOWER berths, each can hold 2 RAC passengers (18 total RAC slots)
- **Waiting List:** Maximum 10 passengers
- **Children under 5:** Do not get a berth or waiting list slot, but are stored in the system

### Priority Rules

- Senior citizens (60+) and ladies with children below 5 get priority for confirmed berths.
- RAC and waiting list allocation also consider these priorities.
- Cancellation refunds are processed automatically based on the original payment method.

---

## API Endpoints


### Ticket Booking

- `POST /api/v1/ticket/book`: Book tickets
- `POST /api/ticket/cancel/{id}`: Cancel booked tickets
- `GET /api/tickets/:pnr`: Get ticket details by PNR
- `GET /api/ticket/booked`: Get all tickets for the logged-in user



### Documentation

- `GET /api-docs`: Swagger API documentation

---

## Database Schema


### berths

| Field         | Type   | Description                                      |
|---------------|--------|--------------------------------------------------|
| id            | int    | Unique identifier for the berth                  |
| berth_number  | int    | Berth number                                     |
| berth_type    | enum   | Type of berth: LOWER, MIDDLE, UPPER, SIDE_LOWER, SIDE_UPPER |
| status        | enum   | Berth status: AVAILABLE, BOOKED, RAC             |
| created_at    | timestamp | Creation timestamp                             |
| updated_at    | timestamp | Last update timestamp                          |

---

### passengers

| Field              | Type      | Description                                         |
|--------------------|-----------|-----------------------------------------------------|
| id                 | int       | Unique identifier for the passenger                 |
| ticket_id          | int       | Foreign key to the ticket                           |
| name               | varchar   | Passenger name                                      |
| age                | int       | Passenger age                                       |
| gender             | enum      | MALE, FEMALE, OTHER                                 |
| berth_id           | int       | Foreign key to the berth (nullable)                 |
| berth_position     | int       | RAC position (1 or 2, nullable)                     |
| status             | enum      | CONFIRMED, RAC, WAITING_LIST, NO_BERTH, CANCELLED   |
| waiting_list_number| int       | Waiting list number (nullable)                      |
| created_at         | timestamp | Creation timestamp                                  |
| updated_at         | timestamp | Last update timestamp                               |

---

### tickets

| Field        | Type      | Description                                         |
|--------------|-----------|-----------------------------------------------------|
| id           | int       | Unique identifier for the ticket                    |
| pnr          | varchar   | Passenger Name Record identifier (unique)           |
| status       | enum      | CONFIRMED, RAC, WAITING_LIST, CANCELLED             |
| booking_date | timestamp | Booking date                                        |
| created_at   | timestamp | Creation timestamp                                  |
| updated_at   | timestamp | Last update timestamp                               |

---

## Technologies

- **Node.js**: JavaScript runtime for building the API
- **Express**: Web framework for Node.js
- **MySQL**: Relational database for storing data
- **Swagger**: API documentation and testing
- **Nodemon**: Development tool for auto-restarting the server

---

## Installation & Setup

1. Clone the repository: `git clone <repo-url>`
2. Navigate to the project directory: `cd Railway-Ticket-Booking`
3. Install dependencies: `npm install`
4. Set up environment variables in a `.env` file (see `.env.example`)
5. Migrate the tables `npx sequelize-cli db:migrate`
6. Seed the table `npx sequelize-cli db:seed:all` 
7. Run the application: `npm start`

---

## Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Commit your changes: `git commit -m 'Add your feature'`
5. Push to the branch: `git push origin feature/your-feature`
6. Create a pull request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgements

- Inspired by real-world railway booking systems
- Built as a learning project for Node.js and API development
