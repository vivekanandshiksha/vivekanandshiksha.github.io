/* ==========================================================================
   Teacher Dashboard — Vivekanand Shiksha Niketan Junior High School
   Functional logic using Firebase Realtime Database (via firebase.js).
   Data lives under these Realtime Database paths:
   /students, /attendance, /homework, /results
   ========================================================================== */

// ---------- Login guard ----------
// Blocks direct access to this page unless the teacher logged in via
// teacher-login.html in this same browser session.
if (sessionStorage.getItem("teacherLoggedIn") !== "true") {
  window.location.href = "teacher-login.html";
}

// ---------- State (kept in sync with Firebase in real time) ----------

let students   = [];
let attendance = [];
let homework   = [];
let results    = [];
let teachers   = [];
let fees       = [];
let notices    = [];
let gallery    = [];

// ---------- On page load ----------

document.addEventListener("DOMContentLoaded", function () {

  document.body.classList.add("is-loaded");

  // Live listeners — table/cards refresh automatically whenever data changes
  db.ref("students").on("value", function (snap) {
    const val = snap.val() || {};
    students = Object.keys(val).map(key => Object.assign({ key: key }, val[key]));
    renderStudentTable();
    renderDashboardCounts();
    populateFeeStudentDropdown();
  });

  db.ref("attendance").on("value", function (snap) {
    const val = snap.val() || {};
    attendance = Object.keys(val).map(key => Object.assign({ key: key }, val[key]));
    renderDashboardCounts();
  });

  db.ref("homework").on("value", function (snap) {
    const val = snap.val() || {};
    homework = Object.keys(val).map(key => Object.assign({ key: key }, val[key]));
  });

  db.ref("results").on("value", function (snap) {
    const val = snap.val() || {};
    results = Object.keys(val).map(key => Object.assign({ key: key }, val[key]));
    renderDashboardCounts();
  });

  db.ref("teachers").on("value", function (snap) {
    const val = snap.val() || {};
    teachers = Object.keys(val).map(key => Object.assign({ key: key }, val[key]));
    renderTeacherTable();
    renderDashboardCounts();
  });

  db.ref("fees").on("value", function (snap) {
    const val = snap.val() || {};
    fees = Object.keys(val).map(key => Object.assign({ key: key }, val[key]));
    renderFeesTable();
  });

  db.ref("notices").on("value", function (snap) {
    const val = snap.val() || {};
    notices = Object.keys(val).map(key => Object.assign({ key: key }, val[key]));
    renderNoticeList();
  });

  db.ref("gallery").on("value", function (snap) {
    const val = snap.val() || {};
    gallery = Object.keys(val).map(key => Object.assign({ key: key }, val[key]));
    renderGalleryGrid();
  });

  db.ref("settings").on("value", function (snap) {
    const val = snap.val() || {};
    fillSettingsForm(val);
  });

  const addStudentBtn = document.querySelector(".student-toolbar .add-btn");
  if (addStudentBtn) {
    addStudentBtn.addEventListener("click", function () {
      document.querySelector(".student-form").scrollIntoView({ behavior: "smooth" });
    });
  }

  const studentForm = document.querySelector(".student-form form");
  if (studentForm) {
    studentForm.addEventListener("submit", function (e) {
      e.preventDefault();
      addStudent(studentForm);
    });
  }

  const searchInput = document.querySelector(".search-box input");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      renderStudentTable(searchInput.value);
    });
  }

  const attendanceBtn = document.querySelector(".attendance-btn");
  if (attendanceBtn) {
    attendanceBtn.addEventListener("click", loadAttendanceStudents);
  }

  const attendanceSaveBtn = document.querySelector(".attendance-section .save-btn");
  if (attendanceSaveBtn) {
    attendanceSaveBtn.addEventListener("click", saveAttendance);
  }

  const homeworkSaveBtn = document.querySelector(".homework-section .save-btn");
  if (homeworkSaveBtn) {
    homeworkSaveBtn.addEventListener("click", saveHomework);
  }

  const resultSaveBtn = document.getElementById("saveResultBtn");
  if (resultSaveBtn) {
    resultSaveBtn.addEventListener("click", saveResult);
  }

  const addSubjectRowBtn = document.getElementById("addSubjectRowBtn");
  if (addSubjectRowBtn) {
    addSubjectRowBtn.addEventListener("click", addSubjectRow);
  }

  const resultSubjectBody = document.getElementById("resultSubjectBody");
  if (resultSubjectBody) {
    resultSubjectBody.addEventListener("click", function (e) {
      const btn = e.target.closest(".remove-subject-row");
      if (btn) {
        const rows = resultSubjectBody.querySelectorAll("tr");
        if (rows.length > 1) {
          btn.closest("tr").remove();
        } else {
          alert("At least one subject row is required.");
        }
      }
    });
  }

  const teacherForm = document.getElementById("teacherForm");
  if (teacherForm) {
    teacherForm.addEventListener("submit", function (e) {
      e.preventDefault();
      saveTeacher();
    });
  }

  const generateMarksheetBtn = document.getElementById("generateMarksheetBtn");
  if (generateMarksheetBtn) {
    generateMarksheetBtn.addEventListener("click", generateMarksheet);
  }

  const printMarksheetBtn = document.getElementById("printMarksheetBtn");
  if (printMarksheetBtn) {
    printMarksheetBtn.addEventListener("click", function () { window.print(); });
  }

  const feesForm = document.getElementById("feesForm");
  if (feesForm) {
    feesForm.addEventListener("submit", function (e) {
      e.preventDefault();
      saveFee();
    });
    populateFeeStudentDropdown();
  }

  const noticeForm = document.getElementById("noticeForm");
  if (noticeForm) {
    noticeForm.addEventListener("submit", function (e) {
      e.preventDefault();
      saveNotice();
    });
  }

  const galleryForm = document.getElementById("galleryForm");
  if (galleryForm) {
    galleryForm.addEventListener("submit", function (e) {
      e.preventDefault();
      saveGalleryItem();
    });
  }

  const settingsForm = document.getElementById("settingsForm");
  if (settingsForm) {
    settingsForm.addEventListener("submit", function (e) {
      e.preventDefault();
      saveSettings();
    });
  }

  // Sidebar navigation: click a menu item to scroll to its section
  document.querySelectorAll(".sidebar li").forEach(function (li, index) {
    li.addEventListener("click", function () {
      document.querySelectorAll(".sidebar li").forEach(el => el.classList.remove("active"));
      li.classList.add("active");

      const sectionMap = [
        null, // Dashboard -> top
        ".student-management",
        ".teacher-management",
        ".attendance-section",
        ".result-section",
        ".marksheet-section",
        ".fees-section",
        ".notice-section",
        ".gallery-section",
        ".settings-section",
        null  // Logout
      ];

      if (index === sectionMap.length - 1) {
        logoutTeacher();
        return;
      }

      const target = sectionMap[index];
      if (target && document.querySelector(target)) {
        document.querySelector(target).scrollIntoView({ behavior: "smooth" });
      } else if (index === 0) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });

});

// ---------- Dashboard summary cards ----------

function renderDashboardCounts() {
  const cards = document.querySelectorAll(".dashboard-cards .card h2");
  if (cards.length < 4) return;

  const today = new Date().toISOString().split("T")[0];
  const todaysRecords = attendance.filter(a => a.date === today);
  const presentCount = todaysRecords.filter(a => a.status === "Present").length;
  const attendancePercent = todaysRecords.length
    ? Math.round((presentCount / todaysRecords.length) * 100)
    : 0;

  cards[0].textContent = students.length;
  cards[1].textContent = teachers.length;
  cards[2].textContent = attendancePercent + "%";
  cards[3].textContent = results.length;
}

// ---------- Student management ----------

function addStudent(form) {
  const inputs = form.querySelectorAll(".form-group input, .form-group select");

  const student = {
    name: inputs[1].value.trim(),
    father: inputs[2].value.trim(),
    mother: inputs[3].value.trim(),
    dob: inputs[4].value,
    gender: inputs[5].value,
    className: inputs[6].value,
    section: inputs[7].value.trim(),
    roll: inputs[8].value.trim(),
    sr: inputs[9].value.trim(),
    studentUdise: inputs[10].value.trim(),
    mobile: inputs[11].value.trim(),
    address: form.querySelector("textarea").value.trim()
  };

  if (!student.name) {
    alert("Please enter the student's name before saving.");
    return;
  }

  db.ref("students").push(student)
    .then(function () {
      form.reset();
      alert("Student record saved.");
    })
    .catch(function (err) {
      alert("Could not save student: " + err.message);
    });
}

function renderStudentTable(filter) {
  const tbody = document.querySelector(".student-table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const list = filter
    ? students.filter(s =>
        (s.name || "").toLowerCase().includes(filter.toLowerCase()) ||
        (s.sr || "").toLowerCase().includes(filter.toLowerCase()) ||
        (s.roll || "").toLowerCase().includes(filter.toLowerCase())
      )
    : students;

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#8891AC;">No students added yet.</td></tr>';
    return;
  }

  list.forEach(function (s) {
    const row = document.createElement("tr");
    row.innerHTML =
      '<td><img src="images/student.png" class="student-photo"></td>' +
      "<td>" + (s.name || "") + "</td>" +
      "<td>" + (s.father || "") + "</td>" +
      "<td>" + (s.mother || "") + "</td>" +
      "<td>" + (s.className || "") + "</td>" +
      "<td>" + (s.section || "") + "</td>" +
      "<td>" + (s.roll || "") + "</td>" +
      "<td>" + (s.sr || "") + "</td>" +
      "<td>" + (s.mobile || "") + "</td>" +
      '<td>' +
      '<button class="view-btn" title="View"><i class="fa-solid fa-eye"></i></button>' +
      '<button class="edit-btn" title="Edit"><i class="fa-solid fa-pen"></i></button>' +
      '<button class="delete-btn" title="Delete" data-key="' + s.key + '"><i class="fa-solid fa-trash"></i></button>' +
      "</td>";
    tbody.appendChild(row);
  });

  tbody.querySelectorAll(".delete-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (confirm("Delete this student record?")) {
        deleteStudent(btn.getAttribute("data-key"));
      }
    });
  });
}

function deleteStudent(key) {
  db.ref("students/" + key).remove()
    .catch(function (err) {
      alert("Could not delete student: " + err.message);
    });
}

// ---------- Attendance ----------

function loadAttendanceStudents() {
  const selects = document.querySelectorAll(".attendance-top select");
  const dateInput = document.querySelector(".attendance-top input[type='date']");
  const className = selects[0] ? selects[0].value : "";
  const section = selects[1] ? selects[1].value : "";

  const tbody = document.querySelector(".attendance-section tbody");
  if (!tbody) return;

  const matched = students.filter(function (s) {
    const classOk = !className || className === "Select Class" || s.className === className;
    const sectionOk = !section || section === "Select Section" || s.section === section;
    return classOk && sectionOk;
  });

  tbody.innerHTML = "";

  if (matched.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#8891AC;">No students found for this class/section.</td></tr>';
    return;
  }

  matched.forEach(function (s) {
    const row = document.createElement("tr");
    row.dataset.studentKey = s.key;
    row.innerHTML =
      '<td><img src="images/student.png" class="student-photo"></td>' +
      "<td>" + (s.roll || "") + "</td>" +
      "<td>" + (s.name || "") + "</td>" +
      '<td><input type="radio" name="att_' + s.key + '" value="Present"></td>' +
      '<td><input type="radio" name="att_' + s.key + '" value="Absent"></td>' +
      '<td><input type="radio" name="att_' + s.key + '" value="Leave"></td>';
    tbody.appendChild(row);
  });

  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }
}

function saveAttendance() {
  const dateInput = document.querySelector(".attendance-top input[type='date']");
  const date = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split("T")[0];

  const rows = document.querySelectorAll(".attendance-section tbody tr[data-student-key]");
  if (rows.length === 0) {
    alert("Load students first, then mark attendance.");
    return;
  }

  const updates = {};
  let savedCount = 0;

  rows.forEach(function (row) {
    const studentKey = row.dataset.studentKey;
    const checked = row.querySelector("input[type='radio']:checked");
    if (!checked) return;

    const recordKey = studentKey + "_" + date;
    updates[recordKey] = { studentKey: studentKey, date: date, status: checked.value };
    savedCount++;
  });

  if (savedCount === 0) {
    alert("Mark at least one student's attendance before saving.");
    return;
  }

  db.ref("attendance").update(updates)
    .then(function () {
      alert(savedCount + " attendance record(s) saved for " + date + ".");
    })
    .catch(function (err) {
      alert("Could not save attendance: " + err.message);
    });
}

// ---------- Homework ----------

function saveHomework() {
  const section = document.querySelector(".homework-section");
  const select = section.querySelector("select");
  const subjectInput = section.querySelectorAll("input")[0];
  const dateInput = section.querySelector("input[type='date']");
  const textarea = section.querySelector("textarea");

  if (!subjectInput.value.trim() || !textarea.value.trim()) {
    alert("Please fill in subject and homework details.");
    return;
  }

  db.ref("homework").push({
    className: select.value,
    subject: subjectInput.value.trim(),
    date: dateInput.value,
    content: textarea.value.trim()
  })
    .then(function () {
      subjectInput.value = "";
      textarea.value = "";
      alert("Homework published.");
    })
    .catch(function (err) {
      alert("Could not publish homework: " + err.message);
    });
}

// ---------- Results (subject-wise) ----------

function addSubjectRow() {
  const tbody = document.getElementById("resultSubjectBody");
  const row = document.createElement("tr");
  row.innerHTML =
    '<td><input type="text" class="subject-name" placeholder="e.g. Mathematics"></td>' +
    '<td><input type="number" class="subject-obtained" style="width:80px;"></td>' +
    '<td><input type="number" class="subject-max" style="width:80px;" value="100"></td>' +
    '<td><button type="button" class="delete-btn remove-subject-row"><i class="fa-solid fa-trash"></i></button></td>';
  tbody.appendChild(row);
}

function computeGrade(percentage) {
  if (percentage >= 90) return "A+";
  if (percentage >= 75) return "A";
  if (percentage >= 60) return "B";
  if (percentage >= 45) return "C";
  if (percentage >= 33) return "D";
  return "F";
}

function saveResult() {
  const roll = document.getElementById("resultRoll").value.trim();
  const session = document.getElementById("resultSession").value.trim();
  const exam = document.getElementById("resultExam").value;
  const className = document.getElementById("resultClass").value;
  const section = document.getElementById("resultSection").value;

  if (!roll) {
    alert("Please enter the student's roll number.");
    return;
  }
  if (!session) {
    alert("Please enter the session (e.g. 2026-2027).");
    return;
  }

  const student = students.find(s => s.roll === roll && s.className === className);

  const rows = document.querySelectorAll("#resultSubjectBody tr");
  const subjects = [];
  let totalObtained = 0;
  let totalMax = 0;

  rows.forEach(function (row) {
    const name = row.querySelector(".subject-name").value.trim();
    const obtained = parseFloat(row.querySelector(".subject-obtained").value) || 0;
    const max = parseFloat(row.querySelector(".subject-max").value) || 0;
    if (name) {
      subjects.push({ subject: name, obtained: obtained, max: max });
      totalObtained += obtained;
      totalMax += max;
    }
  });

  if (subjects.length === 0) {
    alert("Please add at least one subject with marks.");
    return;
  }

  const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;
  const grade = computeGrade(percentage);

  const record = {
    roll: roll,
    studentName: student ? student.name : "",
    session: session,
    exam: exam,
    className: className,
    section: section,
    subjects: subjects,
    totalObtained: totalObtained,
    totalMax: totalMax,
    percentage: percentage,
    grade: grade
  };

  db.ref("results").push(record)
    .then(function () {
      alert("Result saved for Roll No. " + roll + " (" + percentage + "% — Grade " + grade + ").");
    })
    .catch(function (err) {
      alert("Could not save result: " + err.message);
    });
}

// ---------- Teacher Management ----------

function saveTeacher() {
  const name = document.getElementById("teacherName").value.trim();
  const subject = document.getElementById("teacherSubject").value.trim();
  const mobile = document.getElementById("teacherMobile").value.trim();
  const classTeacherOf = document.getElementById("teacherClass").value;

  if (!name) {
    alert("Please enter the teacher's name.");
    return;
  }

  db.ref("teachers").push({ name, subject, mobile, classTeacherOf })
    .then(function () {
      document.getElementById("teacherForm").reset();
      alert("Teacher record saved.");
    })
    .catch(function (err) {
      alert("Could not save teacher: " + err.message);
    });
}

function renderTeacherTable() {
  const tbody = document.getElementById("teacherTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (teachers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#8891AC;">No teachers added yet.</td></tr>';
    return;
  }

  teachers.forEach(function (t) {
    const row = document.createElement("tr");
    row.innerHTML =
      "<td>" + (t.name || "") + "</td>" +
      "<td>" + (t.subject || "") + "</td>" +
      "<td>" + (t.mobile || "") + "</td>" +
      "<td>" + (t.classTeacherOf || "") + "</td>" +
      '<td><button class="delete-btn" data-key="' + t.key + '"><i class="fa-solid fa-trash"></i></button></td>';
    tbody.appendChild(row);
  });

  tbody.querySelectorAll(".delete-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (confirm("Remove this teacher record?")) {
        db.ref("teachers/" + btn.getAttribute("data-key")).remove();
      }
    });
  });
}

// ---------- Marksheet Generator ----------

function generateMarksheet() {
  const roll = document.getElementById("marksheetRoll").value.trim();
  const className = document.getElementById("marksheetClass").value;
  const session = document.getElementById("marksheetSession").value.trim();
  const output = document.getElementById("marksheetOutput");

  if (!roll) {
    alert("Please enter a roll number.");
    return;
  }

  const student = students.find(s => s.roll === roll && s.className === className);

  if (!student) {
    output.innerHTML = '<p style="color:#8891AC;padding:16px 0;">No student found with this roll number in the selected class.</p>';
    return;
  }

  const matches = results.filter(function (r) {
    return r.roll === roll && r.className === className && (!session || r.session === session);
  });

  if (matches.length === 0) {
    output.innerHTML = '<p style="color:#8891AC;padding:16px 0;">No result entry found yet for this student/session. Add one in Result &amp; Examination first.</p>';
    return;
  }

  // Use the most recently saved matching result
  const record = matches[matches.length - 1];

  let subjectRows = "";
  (record.subjects || []).forEach(function (s) {
    const pct = s.max > 0 ? Math.round((s.obtained / s.max) * 1000) / 10 : 0;
    subjectRows += "<tr><td>" + s.subject + "</td><td>" + s.max + "</td><td>" + s.obtained + "</td><td>" + computeGrade(pct) + "</td></tr>";
  });

  const today = new Date().toLocaleDateString("en-GB");

  output.innerHTML =
    '<div class="marksheet-card">' +
      '<div class="marksheet-watermark"><img src="logo.png" alt=""></div>' +
      '<div class="marksheet-inner">' +

      '<div class="marksheet-head">' +
        '<img src="logo.png" alt="School Logo">' +
        '<h2>Vivekanand Shiksha Niketan Junior High School</h2>' +
        '<p>English Medium School &nbsp;|&nbsp; Classes 1 to 8 &nbsp;|&nbsp; School UDISE: 09330801622</p>' +
        '<p>Aazad Nagar, Sikandra, Kanpur Dehat, Uttar Pradesh</p>' +
      '</div>' +

      '<div class="marksheet-divider"><span>❖</span></div>' +

      '<h3 class="marksheet-title">Report Card — ' + (record.exam || "") + '</h3>' +

      '<table class="marksheet-info">' +
        '<tr><td><b>Student Name</b>' + (student.name || "-") + '</td>' +
        '<td><b>Father\'s Name</b>' + (student.father || "-") + '</td>' +
        '<td><b>Mother\'s Name</b>' + (student.mother || "-") + '</td></tr>' +
        '<tr><td><b>Class / Section</b>' + (student.className || "-") + ' - ' + (student.section || "-") + '</td>' +
        '<td><b>Roll No.</b>' + (student.roll || "-") + '</td>' +
        '<td><b>Session</b>' + (record.session || "-") + '</td></tr>' +
        '<tr><td colspan="3"><b>Student UDISE Number</b>' + (student.studentUdise || "-") + '</td></tr>' +
      '</table>' +

      '<table class="marksheet-marks">' +
        '<thead><tr><th>Subject</th><th>Max Marks</th><th>Marks Obtained</th><th>Grade</th></tr></thead>' +
        '<tbody>' + subjectRows + '</tbody>' +
        '<tfoot><tr><td><b>Total</b></td><td><b>' + record.totalMax + '</b></td><td><b>' + record.totalObtained + '</b></td><td><b>' + record.grade + '</b></td></tr></tfoot>' +
      '</table>' +

      '<div class="marksheet-summary">' +
        '<div><span>Percentage</span><b>' + record.percentage + '%</b></div>' +
        '<div><span>Overall Grade</span><b>' + record.grade + '</b></div>' +
        '<div><span>Result</span><b>' + (record.percentage >= 33 ? "PASS" : "FAIL") + '</b></div>' +
      '</div>' +

      '<div class="marksheet-signatures">' +
        '<div class="sign-block"><span class="line"></span>Class Teacher</div>' +
        '<div class="marksheet-seal">School<br>Seal</div>' +
        '<div class="sign-block"><span class="line"></span>Principal</div>' +
        '<div class="sign-block"><span class="line"></span>Parent/Guardian</div>' +
      '</div>' +

      '<p class="marksheet-footer">Generated on ' + today + ' — Vivekanand Shiksha Niketan Junior High School</p>' +

      '</div>' +
    '</div>';
}

// ---------- Fees Management ----------

function populateFeeStudentDropdown() {
  const select = document.getElementById("feeStudent");
  if (!select) return;

  const currentValue = select.value;
  select.innerHTML = '<option value="">Select Student</option>';

  students.forEach(function (s) {
    const opt = document.createElement("option");
    opt.value = s.key;
    opt.textContent = s.name + " (Class " + s.className + ", Roll " + s.roll + ")";
    select.appendChild(opt);
  });

  select.value = currentValue;
}

function saveFee() {
  const studentKey = document.getElementById("feeStudent").value;
  const month = document.getElementById("feeMonth").value;
  const amount = document.getElementById("feeAmount").value;
  const status = document.getElementById("feeStatus").value;

  if (!studentKey) {
    alert("Please select a student.");
    return;
  }

  const student = students.find(s => s.key === studentKey);

  db.ref("fees").push({
    studentKey,
    studentName: student ? student.name : "",
    month,
    amount,
    status
  })
    .then(function () {
      document.getElementById("feesForm").reset();
      alert("Fee record saved.");
    })
    .catch(function (err) {
      alert("Could not save fee record: " + err.message);
    });
}

function renderFeesTable() {
  const tbody = document.getElementById("feesTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (fees.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#8891AC;">No fee records yet.</td></tr>';
    return;
  }

  fees.forEach(function (f) {
    const row = document.createElement("tr");
    const statusColor = f.status === "Paid" ? "var(--green)" : "var(--red)";
    row.innerHTML =
      "<td>" + (f.studentName || "") + "</td>" +
      "<td>" + (f.month || "") + "</td>" +
      "<td>₹" + (f.amount || "0") + "</td>" +
      '<td style="color:' + statusColor + ';font-weight:600;">' + (f.status || "") + "</td>" +
      '<td><button class="delete-btn" data-key="' + f.key + '"><i class="fa-solid fa-trash"></i></button></td>';
    tbody.appendChild(row);
  });

  tbody.querySelectorAll(".delete-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (confirm("Remove this fee record?")) {
        db.ref("fees/" + btn.getAttribute("data-key")).remove();
      }
    });
  });
}

// ---------- Notice Board ----------

function saveNotice() {
  const title = document.getElementById("noticeTitle").value.trim();
  const date = document.getElementById("noticeDate").value;
  const message = document.getElementById("noticeMessage").value.trim();

  if (!title || !message) {
    alert("Please fill in the notice title and message.");
    return;
  }

  db.ref("notices").push({ title, date, message })
    .then(function () {
      document.getElementById("noticeForm").reset();
      alert("Notice published.");
    })
    .catch(function (err) {
      alert("Could not publish notice: " + err.message);
    });
}

function renderNoticeList() {
  const list = document.getElementById("noticeList");
  if (!list) return;

  list.innerHTML = "";

  if (notices.length === 0) {
    list.innerHTML = '<p style="color:#8891AC;">No notices published yet.</p>';
    return;
  }

  notices
    .slice()
    .reverse()
    .forEach(function (n) {
      const card = document.createElement("div");
      card.className = "notice-card";
      card.innerHTML =
        "<div class='notice-card-header'><strong>" + (n.title || "") + "</strong><span>" + (n.date || "") + "</span></div>" +
        "<p>" + (n.message || "") + "</p>" +
        '<button class="delete-btn" data-key="' + n.key + '"><i class="fa-solid fa-trash"></i></button>';
      list.appendChild(card);
    });

  list.querySelectorAll(".delete-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (confirm("Delete this notice?")) {
        db.ref("notices/" + btn.getAttribute("data-key")).remove();
      }
    });
  });
}

// ---------- Gallery ----------

function saveGalleryItem() {
  const url = document.getElementById("galleryUrl").value.trim();
  const caption = document.getElementById("galleryCaption").value.trim();

  if (!url) {
    alert("Please enter an image URL.");
    return;
  }

  db.ref("gallery").push({ url, caption })
    .then(function () {
      document.getElementById("galleryForm").reset();
    })
    .catch(function (err) {
      alert("Could not add to gallery: " + err.message);
    });
}

function renderGalleryGrid() {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (gallery.length === 0) {
    grid.innerHTML = '<p style="color:#8891AC;">No photos added yet.</p>';
    return;
  }

  gallery.forEach(function (g) {
    const item = document.createElement("div");
    item.className = "gallery-item";
    item.innerHTML =
      '<img src="' + g.url + '" alt="' + (g.caption || "Gallery photo") + '">' +
      "<p>" + (g.caption || "") + "</p>" +
      '<button class="delete-btn" data-key="' + g.key + '"><i class="fa-solid fa-trash"></i></button>';
    grid.appendChild(item);
  });

  grid.querySelectorAll(".delete-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (confirm("Remove this photo?")) {
        db.ref("gallery/" + btn.getAttribute("data-key")).remove();
      }
    });
  });
}

// ---------- Settings ----------

function fillSettingsForm(settings) {
  if (!settings) return;
  const phone = document.getElementById("settingPhone");
  const email = document.getElementById("settingEmail");
  const timing = document.getElementById("settingTiming");
  const admission = document.getElementById("settingAdmission");

  if (phone && settings.phone) phone.value = settings.phone;
  if (email && settings.email) email.value = settings.email;
  if (timing && settings.timing) timing.value = settings.timing;
  if (admission && settings.admission) admission.value = settings.admission;
}

function saveSettings() {
  const settings = {
    phone: document.getElementById("settingPhone").value.trim(),
    email: document.getElementById("settingEmail").value.trim(),
    timing: document.getElementById("settingTiming").value.trim(),
    admission: document.getElementById("settingAdmission").value
  };

  db.ref("settings").set(settings)
    .then(function () {
      alert("Settings saved.");
    })
    .catch(function (err) {
      alert("Could not save settings: " + err.message);
    });
}

// ---------- Logout ----------

function logoutTeacher() {
  if (confirm("Logout from Teacher Dashboard?")) {
    sessionStorage.removeItem("teacherLoggedIn");
    window.location.href = "teacher-login.html";
  }
}
