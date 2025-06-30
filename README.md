# 🎯 Saga Orchestrator Pattern in Express.js

A lightweight implementation of the Saga pattern using TypeScript and Express.js, designed to model long-running workflows with failure handling and rollback logic — cleanly, predictably, and with zero jargon.

---

## 📌 Overview

This repository demonstrates a **Saga Orchestrator** that executes a sequence of operations step by step. If any step fails, previously completed steps are automatically rolled back using their corresponding `compensate()` handlers.

It’s built using:

- ✅ TypeScript-first architecture
- ✅ Functional result wrapping with [`neverthrow`](https://github.com/supermacro/neverthrow)
- ✅ Custom logging with `winston`
- ✅ Express.js for demonstrating request-based orchestration

---

## ❗ Problem

In many real-world systems — like creating a user, assigning roles, and notifying services — you often need to:

- Perform multiple operations across services
- Ensure **partial failures don’t leave the system in an inconsistent state**
- Avoid heavy distributed transactions or two-phase commits

Traditional `try/catch` approaches become messy, unscalable, and hard to maintain as workflows grow.

---

## ✅ Benefits

By applying the Saga Pattern:

- 🧹 Each step has a clear `compensate()` rollback
- 🔁 Built-in retry logic improves resilience
- 💥 Failure handling is consistent and modular
- 🧪 Context and step results are preserved for traceability
- 📜 Easy to extend with conditional steps, checkpoints, or audit logs

---

## 🚀 Installation

### 🐳 Install Docker Desktop
- Download and install Docker: [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

### 💾 Setup Redis Using Docker

```bash
docker pull redis
docker run --name my-redis -d -p 6379:6379 redis
```

#### 📦 Project Setup
- Clone the Repository
```bash
git clone <your-repo-url>
cd <your-project-directory>
``` 
- 🧰 Setup `util` Service
    - Move into the util solution and create an .env file:
    ```bash
    NODE_ENV=development

    # Redis
    REDIS_HOST = 127.0.0.1
    #Local Docker
    #DB_HOST=host.docker.internal
    #REDIS_USERNAME = username
    #REDIS_PASSWORD = password
    REDIS_DB = 0
    REDIS_PORT = 6379

    ```
    - Install dependencies:
    ```bash
    npm i
    ```
    - Build the utility package:
    ```bash
    npm run build
    ```
    - Link the package:
    ```bash
    npm link
    ```
- 🌐 Setup `api` Service
    - Move into the api solution and create an .env file:
    ```bash
    NODE_ENV=development
    PORT=3000

    # Logging
    LOG_FORMAT=dev
    LOG_DIR=logs

    # CORS Config
    ORIGIN=*
    CREDENTIALS=true

    # Redis
    REDIS_HOST = 127.0.0.1
    #Local Docker
    #DB_HOST=host.docker.internal
    #REDIS_USERNAME = username
    #REDIS_PASSWORD = password
    REDIS_DB = 0
    REDIS_PORT = 6379

    # Rate Limiter
    RATE_LIMITER=1000
    ```
    - Install dependencies:
    ```bash
    npm i
    ```
    - Link the `util` package:
    ```bash
    npm link <utilurl>
    ```
    - Build the Api service:
    ```bash
    npm run build
    ```
    - Run the API in development mode:
    ```bash
    npm run dev
    ```
📌 Note: 
- This demo uses bullmq to simulate inter-module coordination a lightweight message queue built on Redis. It handles internal step communication and orchestrated retries using saga semantics.
- This demo uses [Pipeline Workflow](https://github.com/KishorNaik/Sol_pipeline_workflow_expressJs) provides a structured approach to executing sequential operations, ensuring safe execution flow, error resilience, and efficient logging.

---

## Source Code
- Helper
    https://github.com/KishorNaik/Sol_Saga_ExpressJs_Typescript/tree/main/utils/src/core/shared/utils/helpers/saga

- Endpoint
    https://github.com/KishorNaik/Sol_Saga_ExpressJs_Typescript/blob/main/api/src/modules/moduleC/apps/features/v1/add/endpoints/index.ts

- Endpoint Service
    https://github.com/KishorNaik/Sol_Saga_ExpressJs_Typescript/tree/main/api/src/modules/moduleC/apps/features/v1/add/endpoints/services

- Module A
  https://github.com/KishorNaik/Sol_Saga_ExpressJs_Typescript/tree/main/api/src/modules/moduleA/apps/features/v1/add

- Module B
  https://github.com/KishorNaik/Sol_Saga_ExpressJs_Typescript/tree/main/api/src/modules/moduleB/apps/features/v1/add