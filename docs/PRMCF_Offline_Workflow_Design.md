# PRMCF Dynamic Offline Form Workflow

## Objective

Build a configurable **Offline Form Workflow Module** where
administrators can create services, upload offline PDF forms, define
required documents, and configure approval workflows without code
changes.

------------------------------------------------------------------------

# Functional Flow

## Admin

1.  Create Service
2.  Upload Offline PDF Form
3.  Configure Required Documents
4.  Configure Approval Workflow
5.  Publish Service

## User

1.  View available services
2.  Download offline form
3.  Fill the form manually
4.  Upload completed form
5.  Upload required supporting documents
6.  Submit request
7.  Track approval status

------------------------------------------------------------------------

# Database Design

## services

``` sql
CREATE TABLE services (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    offline_form_path VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);
```

------------------------------------------------------------------------

## service_documents

``` sql
CREATE TABLE service_documents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    service_id BIGINT NOT NULL,
    document_name VARCHAR(200) NOT NULL,
    mandatory BOOLEAN DEFAULT TRUE,
    allowed_extensions VARCHAR(100),
    max_file_size_mb INT DEFAULT 5,
    display_order INT DEFAULT 1,
    FOREIGN KEY(service_id) REFERENCES services(id)
);
```

------------------------------------------------------------------------

## workflow_steps

``` sql
CREATE TABLE workflow_steps (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    service_id BIGINT NOT NULL,
    step_no INT NOT NULL,
    role VARCHAR(100) NOT NULL,
    can_reject BOOLEAN DEFAULT TRUE,
    is_final BOOLEAN DEFAULT FALSE,
    FOREIGN KEY(service_id) REFERENCES services(id)
);
```

------------------------------------------------------------------------

## service_requests

``` sql
CREATE TABLE service_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    request_no VARCHAR(30) UNIQUE,
    service_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'SUBMITTED',
    current_step INT DEFAULT 1,
    remarks TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY(service_id) REFERENCES services(id)
);
```

Suggested statuses:

-   SUBMITTED
-   IN_PROGRESS
-   APPROVED
-   REJECTED
-   COMPLETED

------------------------------------------------------------------------

## request_documents

``` sql
CREATE TABLE request_documents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    request_id BIGINT NOT NULL,
    document_type VARCHAR(200),
    file_path VARCHAR(500),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(request_id) REFERENCES service_requests(id)
);
```

Store: - Filled offline form PDF - Aadhaar - Invitation - Death proof -
Any additional document

------------------------------------------------------------------------

## request_workflow_history

``` sql
CREATE TABLE request_workflow_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    request_id BIGINT NOT NULL,
    workflow_step_id BIGINT NOT NULL,
    action_by BIGINT,
    role VARCHAR(100),
    status VARCHAR(50),
    remarks TEXT,
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(request_id) REFERENCES service_requests(id),
    FOREIGN KEY(workflow_step_id) REFERENCES workflow_steps(id)
);
```

------------------------------------------------------------------------

# Example Configuration

Marriage Certificate

Workflow

1.  Admin
2.  President
3.  Secretary
4.  Completed

Required Documents

-   Filled Marriage Form
-   Aadhaar
-   Wedding Invitation
-   Passport Size Photo

------------------------------------------------------------------------

Death Certificate

Workflow

1.  Admin
2.  President
3.  Completed

Required Documents

-   Filled Form
-   Death Certificate
-   Aadhaar

------------------------------------------------------------------------

# APIs

## Admin

-   Create Service
-   Update Service
-   Delete Service
-   Upload Offline Form
-   Configure Required Documents
-   Configure Workflow
-   Publish / Unpublish Service

## User

-   Get Services
-   Download Form
-   Submit Request
-   Upload Documents
-   View My Requests
-   View Request Timeline

## Approver

-   Pending Requests
-   Approve
-   Reject
-   Add Remarks

------------------------------------------------------------------------

# Approval Logic

1.  User submits request.
2.  System creates request.
3.  Current approver = Step 1.
4.  Approver approves.
5.  Move to next step.
6.  Final step marks COMPLETED.
7.  Rejection ends workflow and stores reason.

------------------------------------------------------------------------

# Development Prompt

## Goal

Develop a configurable Offline Form Workflow module using React,
Node.js, and MySQL.

### Requirements

-   No hardcoded services.
-   Services come from database.
-   Admin can:
    -   Create/Edit/Delete services.
    -   Upload offline PDF form.
    -   Configure required documents.
    -   Configure workflow steps.
    -   Publish or unpublish services.
-   User can:
    -   Browse published services.
    -   Download PDF form.
    -   Upload completed form and supporting documents.
    -   Track request status.
-   Approval workflow must be dynamic based on database configuration.
-   Maintain complete workflow history.
-   Show timeline with Submitted, Approved, Rejected, Completed.
-   Validate mandatory documents before submission.
-   Prevent skipping workflow steps.
-   Use role-based authorization for approvers.
-   Design APIs and UI to support future expansion to online e-forms
    without database redesign.

### Deliverables

-   React Admin UI
-   React User UI
-   Node.js REST APIs
-   MySQL schema
-   File upload support
-   Dynamic workflow engine
-   Approval dashboard
-   Request timeline
-   Audit history
