require('dotenv').config();
const express        = require('express');
const path           = require('path');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(expressLayouts);
app.set('layout', 'layout');          

app.use(express.urlencoded({ extended: false }));   
app.use(express.json());                            

app.use(methodOverride('_method'));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/students',     require('./routes/studentRoutes'));
app.use('/companies',    require('./routes/companyRoutes'));
app.use('/jobs',         require('./routes/jobRoutes'));
app.use('/applications', require('./routes/applicationRoutes'));

app.get('/', async (req, res, next) => {
  try {
    const pool = require('./config/db');

    
    const [[{ students }]]    = await pool.query('SELECT COUNT(*) AS students FROM Students');
    const [[{ companies }]]   = await pool.query('SELECT COUNT(*) AS companies FROM Companies');
    const [[{ jobs }]]        = await pool.query(
      "SELECT COUNT(*) AS jobs FROM Jobs WHERE status = 'Open' AND deadline >= CURRENT_DATE"
    );
    const [[{ applications }]] = await pool.query('SELECT COUNT(*) AS applications FROM Applications');

    
    const [recentJobs] = await pool.query(`
      SELECT j.job_id, j.title, j.salary, j.deadline, j.status,
             c.company_name, c.location
      FROM   Jobs j
      JOIN   Companies c ON j.company_id = c.company_id
      WHERE  j.status = 'Open' AND j.deadline >= CURRENT_DATE
      ORDER  BY j.posted_at DESC
      LIMIT  6
    `);

    res.render('index', {
      title      : 'Dashboard',
      stats      : { students, companies, jobs, applications },
      recentJobs
    });
  } catch (err) {
    next(err);
  }
});


app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀  JobNest is running → http://localhost:${PORT}`);
});
