const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function validateStudent(body) {
  const errors = [];
  const { name, email, department, semester } = body;

  if (isBlank(name)) errors.push('Name is required.');
  else if (name.trim().length > 100) errors.push('Name must be 100 characters or fewer.');

  if (isBlank(email)) errors.push('Email is required.');
  else if (!EMAIL_REGEX.test(email.trim())) errors.push('Email must be a valid address (e.g. user@domain.com).');

  if (isBlank(department)) errors.push('Department is required.');

  if (isBlank(semester)) errors.push('Semester is required.');
  else if (!Number.isInteger(Number(semester)) || Number(semester) < 1 || Number(semester) > 12) {
    errors.push('Semester must be a whole number between 1 and 12.');
  }

  return errors;
}

function validateCompany(body) {
  const errors = [];
  const { company_name, email, location } = body;

  if (isBlank(company_name)) errors.push('Company name is required.');
  else if (company_name.trim().length > 150) errors.push('Company name must be 150 characters or fewer.');

  if (isBlank(email)) errors.push('Email is required.');
  else if (!EMAIL_REGEX.test(email.trim())) errors.push('Email must be a valid address (e.g. hr@company.com).');

  if (isBlank(location)) errors.push('Location is required.');

  return errors;
}

function validateJob(body) {
  const errors = [];
  const { company_id, title, salary, deadline } = body;

  if (isBlank(company_id)) errors.push('You must select a company.');
  else if (!Number.isInteger(Number(company_id))) errors.push('Invalid company selected.');

  if (isBlank(title)) errors.push('Job title is required.');
  else if (title.trim().length > 150) errors.push('Job title must be 150 characters or fewer.');

  if (!isBlank(salary)) {
    const salaryNum = Number(salary);
    if (Number.isNaN(salaryNum) || salaryNum <= 0) {
      errors.push('Salary must be a positive number (leave blank if unpaid/unspecified).');
    }
  }

  if (isBlank(deadline)) {
    errors.push('Application deadline is required.');
  } else {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(deadlineDate.getTime())) {
      errors.push('Deadline must be a valid date.');
    } else if (deadlineDate < today) {
      errors.push('Deadline must be a date in the future.');
    }
  }

  return errors;
}

const VALID_APPLICATION_STATUSES = ['Pending', 'Reviewed', 'Accepted', 'Rejected'];

function validateApplication(body) {
  const errors = [];
  const { student_id, job_id, status } = body;

  if (isBlank(student_id) || !Number.isInteger(Number(student_id))) {
    errors.push('You must select a valid student.');
  }

  if (isBlank(job_id) || !Number.isInteger(Number(job_id))) {
    errors.push('You must select a valid job.');
  }

  if (!isBlank(status) && !VALID_APPLICATION_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${VALID_APPLICATION_STATUSES.join(', ')}.`);
  }

  return errors;
}

module.exports = {
  validateStudent,
  validateCompany,
  validateJob,
  validateApplication,
  VALID_APPLICATION_STATUSES
};
