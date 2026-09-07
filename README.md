# Distributed Microservices Architecture with Cross-Database Synchronization

A microservices system built using Node.js (Express), Python (Flask), and MySQL 8.0, containerized with Docker, orchestrated via Docker Compose, and deployed across Google Cloud Platform (GCP) Compute Engine Virtual Machines using private VPC networking.

---

## Architecture Overview

The system consists of three independent domain microservices and one public API Gateway / UI service:

* **API Gateway / Frontend (Node.js/Express):** Acts as the single public entry point (Port `8080`). Aggregates dashboard data from all internal services and routes write requests.
* **Microservice A (Python/Flask + MySQL DB A):** Manages primary write requests and triggers cross-service sync events (Port `5000`).
* **Microservice B (Node.js/Express + MySQL DB B):** Manages local service state and syncs incoming write requests to DB B (Port `5000`).
* **Microservice C (Python/Flask + MySQL DB C):** Manages local service state and syncs incoming write requests to DB C (Port `5000`).


```
                    ┌────────────────────────┐
                    │  Public Client / User  │
                    └───────────┬────────────┘
                                │ HTTP (8080)
                     ┌──────────▼──────────┐
                     │     API Gateway     │
                     └──────────┬──────────┘
                                │ Private VPC / Internal Network
         ┌──────────────────────┼──────────────────────┐
         │ (HTTP :5000)         │ (HTTP :5000)         │ (HTTP :5000)
┌────────▼────────┐    ┌────────▼────────┐    ┌────────▼────────┐
│  Service A      │    │  Service B      │    │  Service C      │
│  (Python/Flask) │    │  (Node.js)      │    │  (Python/Flask) │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
┌────────▼────────┐    ┌────────▼────────┐    ┌────────▼────────┐
│   MySQL DB A    │    │   MySQL DB B    │    │   MySQL DB C    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Project Structure

```text
.
├── api-gateway/
│   ├── index.js
│   ├── package.json
│   └── Dockerfile
├── service-a/
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
├── service-b/
│   ├── index.js
│   ├── package.json
│   └── Dockerfile
├── service-c/
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Part 1: Local Deployment (Docker Compose)

### Prerequisites

* Docker Desktop installed on Windows / Linux / macOS
* Git

### Step-by-Step Instructions

1. **Clone the Repository:**
```bash
git clone [https://github.com/ekse-milo/cc-midpoint.git](https://github.com/ekse-milo/cc-midpoint.git)
cd cc-midpoint
```


2. **Start the Application Stack:**
```bash
docker compose up --build -d
```


3. **Access the Dashboard:**
Open your browser and navigate to:
```text
http://localhost:8080
```


4. **Verify Database Persistence & Sync:**
* Enter an item name into any Service input box on the web dashboard and click **Add**.
* Observe that the record immediately syncs and appears under all three service state tables simultaneously.
* Stop the stack (`docker compose down`) and restart it (`docker compose up -d`). Notice that all records remain intact due to dedicated Docker named volumes (`midpoint-db-a`, `midpoint-db-b`, `midpoint-db-c`).



---

## Part 2: Google Cloud Platform (GCP) Deployment

This architecture is deployed on GCP Compute Engine using a private Virtual Private Cloud (VPC) setup for zero-trust internal network isolation.

### Network Isolation Policy

* **`vm-gateway`:** Configured with an **External Public IP** and **Allow HTTP Traffic** enabled.
* **`vm-service-a`**, **`vm-service-b`**, **`vm-service-c`:** Configured with **No External IP** (Internal IPs only). They are inaccessible directly from the public internet.

---

### Step-by-Step Deployment Steps on GCP

1. **Create Compute Engine VMs:**
* Create `vm-gateway` with an External IP.
* Create `vm-service-a`, `vm-service-b`, and `vm-service-c` with **External IP set to None**. Note down their assigned Internal IP addresses(e.g., 10.128.0.2, 10.128.0.3, 10.128.
0.4).


2. **Setup Code on Each VM:**
SSH into each VM through the GCP Console and install Docker:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose git
git clone [https://github.com/ekse-milo/cc-midpoint.git](https://github.com/ekse-milo/cc-midpoint.git)
```


3. **Configure Gateway Environment:**
On `vm-gateway`, configure environment variables pointing to the internal IPs of the backend VMs:
```env
SERVICE_A_URL=[http://10.128.0.2:5000](http://10.128.0.2:5000)
SERVICE_B_URL=[http://10.128.0.3:5000](http://10.128.0.3:5000)
SERVICE_C_URL=[http://10.128.0.4:5000](http://10.128.0.4:5000)
```


4. **Launch Containers:**
Start the services on their respective VMs using Docker Compose:
```bash
docker compose up --build 
```



---

## Testing API Endpoints

### 1. Web UI Dashboard

* `GET http://<EXTERNAL_IP_OR_LOCALHOST>:8080/`

### 2. JSON Aggregated Dashboard

* `GET http://<EXTERNAL_IP_OR_LOCALHOST>:8080/dashboard-json`

---