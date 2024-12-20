# Supporting Jibu Inc. - TRANSFORM Support Hub

Repository containing work related to supporting Jibu Inc. as part of TRANSFORM Hub by Moving Worlds

## Getting Started

### 1. Backend - Python

1. Install Python - [Download](https://www.python.org/downloads/)
2. Install Poetry - [Download](https://python-poetry.org/docs/#installation)
3. Install Python packages
   ```sh
   poetry install
   ```
4. Duplicate [`.env.example`](./.env.example) to `.env` and substitute AWS Credentials - Access Key & Secret Key - [Instructions](https://aws.amazon.com/blogs/security/wheres-my-secret-access-key/)
5. Start the server
   ```sh
   poetry run flask run
   ```
6. The server is started at http://127.0.0.1:5000

### 2. Frontend - NodeJS

1. Install NodeJS - [Download](https://nodejs.org/en/download/package-manager)
2. Install NPM packages
   ```sh
   npm install
   ```
3. Start the server (which also proxies to backend)
   ```sh
   npm run dev
   ```
4. Access the UI at [http://localhost:5173](http://localhost:5173/)

## License

[Apache 2.0 License](./LICENSE)
