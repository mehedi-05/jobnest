DROP DATABASE IF EXISTS jobnest_db;
CREATE DATABASE jobnest_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE jobnest_db;

CREATE TABLE Students (
  student_id    INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)      NOT NULL,
  email         VARCHAR(150)      NOT NULL,
  department    VARCHAR(100)      NOT NULL,
  semester      TINYINT UNSIGNED  NOT NULL,
  created_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_students_email UNIQUE (email),
  CONSTRAINT chk_students_semester CHECK (semester BETWEEN 1 AND 12),
  CONSTRAINT chk_students_email_format CHECK (email LIKE '%_@__%.__%')
) ENGINE = InnoDB;

CREATE TABLE Companies (
  company_id    INT AUTO_INCREMENT PRIMARY KEY,
  company_name  VARCHAR(150)      NOT NULL,
  email         VARCHAR(150)      NOT NULL,
  location      VARCHAR(150)      NOT NULL,
  created_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_companies_email UNIQUE (email),
  CONSTRAINT chk_companies_email_format CHECK (email LIKE '%_@__%.__%')
) ENGINE = InnoDB;


CREATE TABLE Jobs (
  job_id        INT AUTO_INCREMENT PRIMARY KEY,
  company_id    INT               NOT NULL,
  title         VARCHAR(150)      NOT NULL,
  description   TEXT              NULL,
  salary        DECIMAL(10,2)     NULL,
  deadline      DATE              NOT NULL,
  status        ENUM('Open','Closed') NOT NULL DEFAULT 'Open',
  posted_at     TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_jobs_company
    FOREIGN KEY (company_id) REFERENCES Companies(company_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT chk_jobs_salary_positive CHECK (salary IS NULL OR salary > 0)
) ENGINE = InnoDB;

-- Indexes to speed up common lookups (job listing page, filtering)
CREATE INDEX idx_jobs_company_id ON Jobs(company_id);
CREATE INDEX idx_jobs_deadline   ON Jobs(deadline);
CREATE INDEX idx_jobs_status     ON Jobs(status);


CREATE TABLE Applications (
  application_id    INT AUTO_INCREMENT PRIMARY KEY,
  student_id        INT     NOT NULL,
  job_id            INT     NOT NULL,
  application_date  DATE    NOT NULL DEFAULT (CURRENT_DATE),
  status            ENUM('Pending','Reviewed','Accepted','Rejected')
                            NOT NULL DEFAULT 'Pending',
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_applications_student
    FOREIGN KEY (student_id) REFERENCES Students(student_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_applications_job
    FOREIGN KEY (job_id) REFERENCES Jobs(job_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  -- Prevents the same student from applying to the same job twice
  CONSTRAINT uq_applications_student_job UNIQUE (student_id, job_id)
) ENGINE = InnoDB;

CREATE INDEX idx_applications_student_id ON Applications(student_id);
CREATE INDEX idx_applications_job_id     ON Applications(job_id);
CREATE INDEX idx_applications_status     ON Applications(status);


CREATE TRIGGER trg_jobs_before_insert
BEFORE INSERT ON Jobs
FOR EACH ROW
BEGIN
  IF NEW.salary IS NOT NULL AND NEW.salary <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Salary must be a positive value.';
  END IF;
END$$

-- Same guard for UPDATE
CREATE TRIGGER trg_jobs_before_update
BEFORE UPDATE ON Jobs
FOR EACH ROW
BEGIN
  IF NEW.salary IS NOT NULL AND NEW.salary <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Salary must be a positive value.';
  END IF;
END$$


CREATE TRIGGER trg_applications_before_insert
BEFORE INSERT ON Applications
FOR EACH ROW
BEGIN
  DECLARE v_deadline DATE;
  DECLARE v_status VARCHAR(10);

  SELECT deadline, status INTO v_deadline, v_status
  FROM Jobs WHERE job_id = NEW.job_id;

  IF v_status = 'Closed' OR v_deadline < CURRENT_DATE THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cannot apply: this job is closed or past its deadline.';
  END IF;
END$$


CREATE VIEW vw_active_jobs AS
SELECT
  j.job_id,
  j.title,
  j.description,
  j.salary,
  j.deadline,
  j.status,
  c.company_id,
  c.company_name,
  c.location
FROM Jobs j
JOIN Companies c ON j.company_id = c.company_id
WHERE j.status = 'Open' AND j.deadline >= CURRENT_DATE;


CREATE VIEW vw_application_details AS
SELECT
  a.application_id,
  a.application_date,
  a.status            AS application_status,
  s.student_id,
  s.name              AS student_name,
  s.email             AS student_email,
  s.department,
  j.job_id,
  j.title             AS job_title,
  j.deadline,
  c.company_id,
  c.company_name
FROM Applications a
JOIN Students  s ON a.student_id = s.student_id
JOIN Jobs      j ON a.job_id     = j.job_id
JOIN Companies c ON j.company_id = c.company_id;


CREATE PROCEDURE sp_get_student_applications (IN p_student_id INT)
BEGIN
  SELECT *
  FROM vw_application_details
  WHERE student_id = p_student_id
  ORDER BY application_date DESC;
END$$

CREATE PROCEDURE sp_get_job_applicants (IN p_job_id INT)
BEGIN
  SELECT *
  FROM vw_application_details
  WHERE job_id = p_job_id
  ORDER BY application_date DESC;
END$$


CREATE PROCEDURE sp_close_expired_jobs ()
BEGIN
  UPDATE Jobs
  SET status = 'Closed'
  WHERE deadline < CURRENT_DATE AND status = 'Open';
END$$

DELIMITER ;



INSERT INTO Students (name, email, department, semester) VALUES
('Mehedi Hasan',      'mehedi.hasan@uni.edu',     'CSE', 6),
('Farzana Akter',     'farzana.akter@uni.edu',    'CSE', 4),
('Rakib Hossain',     'rakib.hossain@uni.edu',    'EEE', 7),
('Sumaiya Islam',     'sumaiya.islam@uni.edu',    'CSE', 2),
('Tanvir Ahmed',      'tanvir.ahmed@uni.edu',     'BBA', 5),
('Nusrat Jahan',      'nusrat.jahan@uni.edu',     'CSE', 8);

INSERT INTO Companies (company_name, email, location) VALUES
('BrightTech Solutions',   'hr@brighttech.com',   'Dhaka'),
('NovaSoft Ltd.',          'careers@novasoft.com','Chittagong'),
('PixelForge Studios',     'jobs@pixelforge.com', 'Dhaka'),
('Greenline Logistics',    'hr@greenline.com',    'Sylhet');

INSERT INTO Jobs (company_id, title, description, salary, deadline, status) VALUES
(1, 'Backend Developer Intern',   'Work with Node.js and MySQL on internal tools.',       15000.00, '2026-08-15', 'Open'),
(1, 'Junior QA Engineer',         'Manual and basic automated testing of web apps.',      20000.00, '2026-07-30', 'Open'),
(2, 'Frontend Developer Intern',  'Build UI components using HTML/CSS/JS.',               12000.00, '2026-08-01', 'Open'),
(2, 'Data Entry Assistant',       'Maintain and clean spreadsheets and reports.',          NULL,     '2026-07-20', 'Open'),
(3, 'UI/UX Design Intern',        'Assist in wireframing and prototyping new features.',  10000.00, '2026-08-10', 'Open'),
(3, 'Game Tester',                'Playtest builds and log bugs.',                         8000.00, '2026-07-25', 'Open'),
(4, 'Logistics Coordinator Intern','Support route planning and dispatch.',                 13000.00, '2026-08-05', 'Open'),
(4, 'Operations Trainee',         'Rotational training across operations team.',          18000.00, '2026-06-01', 'Closed');

INSERT INTO Applications (student_id, job_id, application_date, status) VALUES
(1, 1, '2026-06-20', 'Pending'),
(1, 3, '2026-06-21', 'Reviewed'),
(2, 1, '2026-06-22', 'Pending'),
(2, 5, '2026-06-22', 'Accepted'),
(3, 4, '2026-06-18', 'Rejected'),
(3, 7, '2026-06-23', 'Pending'),
(4, 2, '2026-06-19', 'Reviewed'),
(5, 6, '2026-06-24', 'Pending'),
(6, 1, '2026-06-25', 'Pending'),
(6, 3, '2026-06-25', 'Accepted');

