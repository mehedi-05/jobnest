function notFoundHandler(req, res) {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.',
    status: 404
  });
}

function errorHandler(err, req, res, next) { 
  console.error('❌ Error:', err.message);

  let message = 'Something went wrong. Please try again.';
  let status = 500;

  if (err.code === 'ER_DUP_ENTRY') {
    message = 'This record already exists (duplicate entry).';
    status = 409;
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    message = 'Related record not found (invalid reference).';
    status = 400;
  } else if (err.sqlState === '45000') {
    message = err.sqlMessage || message;
    status = 400;
  }

  res.status(status).render('error', {
    title: 'Error',
    message,
    status
  });
}

module.exports = { notFoundHandler, errorHandler };
