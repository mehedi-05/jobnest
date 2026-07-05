const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/applicationController');

router.get ('/',         ctrl.list);
router.get ('/new',      ctrl.newForm);     // needs students + active jobs for dropdowns
router.post('/',         ctrl.create);
router.get ('/:id/edit', ctrl.editForm);    // edit only allows changing status
router.put ('/:id',      ctrl.update);
router.delete('/:id',   ctrl.remove);

module.exports = router;
