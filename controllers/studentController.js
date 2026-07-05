const pool = require('../config/db');
const { validateStudent } = require('../middleware/validators');

exports.list = async (req, res, next) => {
  try {
    const [students] = await pool.query(
      'SELECT * FROM Students ORDER BY created_at ASC'
    );
    res.render('students/list', { title: 'Students', students });
  } catch (err) {
    next(err);
  }
};

exports.newForm = (req, res) => {
  res.render('students/form', {
    title: 'Add Student',
    student: {},
    errors: [],
    formAction: '/students',
    method: 'POST'
  });
};

exports.create = async (req, res, next) => {
  const errors = validateStudent(req.body);

  if (errors.length > 0) {
    return res.status(400).render('students/form', {
      title: 'Add Student',
      student: req.body,
      errors,
      formAction: '/students',
      method: 'POST'
    });
  }

  try {
    const { name, email, department, semester } = req.body;
    await pool.query(
      'INSERT INTO Students (name, email, department, semester) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim(), department.trim(), semester]
    );
    res.redirect('/students');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).render('students/form', {
        title: 'Add Student',
        student: req.body,
        errors: ['A student with this email already exists.'],
        formAction: '/students',
        method: 'POST'
      });
    }
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const [students] = await pool.query('SELECT * FROM Students WHERE student_id = ?', [req.params.id]);
    if (students.length === 0) {
      return res.status(404).render('error', { title: 'Not Found', message: 'Student not found.', status: 404 });
    }

    const [applicationResults] = await pool.query('CALL sp_get_student_applications(?)', [req.params.id]);
    const applications = applicationResults[0]; // CALL returns [rows, metadata]

    res.render('students/show', { title: students[0].name, student: students[0], applications });
  } catch (err) {
    next(err);
  }
};

exports.editForm = async (req, res, next) => {
  try {
    const [students] = await pool.query('SELECT * FROM Students WHERE student_id = ?', [req.params.id]);
    if (students.length === 0) {
      return res.status(404).render('error', { title: 'Not Found', message: 'Student not found.', status: 404 });
    }
    res.render('students/form', {
      title: 'Edit Student',
      student: students[0],
      errors: [],
      formAction: `/students/${req.params.id}?_method=PUT`,
      method: 'POST'
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  const errors = validateStudent(req.body);
  const id = req.params.id;

  if (errors.length > 0) {
    return res.status(400).render('students/form', {
      title: 'Edit Student',
      student: { ...req.body, student_id: id },
      errors,
      formAction: `/students/${id}?_method=PUT`,
      method: 'POST'
    });
  }

  try {
    const { name, email, department, semester } = req.body;
    const [result] = await pool.query(
      'UPDATE Students SET name = ?, email = ?, department = ?, semester = ? WHERE student_id = ?',
      [name.trim(), email.trim(), department.trim(), semester, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).render('error', { title: 'Not Found', message: 'Student not found.', status: 404 });
    }
    res.redirect('/students');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).render('students/form', {
        title: 'Edit Student',
        student: { ...req.body, student_id: id },
        errors: ['A student with this email already exists.'],
        formAction: `/students/${id}?_method=PUT`,
        method: 'POST'
      });
    }
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM Students WHERE student_id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).render('error', { title: 'Not Found', message: 'Student not found.', status: 404 });
    }
    res.redirect('/students');
  } catch (err) {
    next(err);
  }
};
