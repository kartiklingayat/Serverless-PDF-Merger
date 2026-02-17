# Serverless PDF Merger

A fully serverless web application that allows users to merge multiple PDF files directly in the browser.

## Features
- Merge multiple PDF files in the browser.
- Frontend hosted using **AWS S3 Static Website Hosting**.
- Backend implemented with **AWS API Gateway**, **AWS Lambda**, and **S3**.
- Automatic cleanup of uploaded and merged PDFs via **S3 Lifecycle Rules** (files deleted after 2 days).
- Near-zero cost during idle periods due to serverless architecture.


### Architecture
<img src="docs/diagram.jpg" style="width:75%;" alt="Diagram">
