function loginTeacher(){
  let pass=document.getElementById("password").value;
  if(pass=="dhruv058605remo"){
    sessionStorage.setItem("teacherLoggedIn","true");
    window.location="teacher-dashboard.html";
  }
  else{
    document.getElementById("msg").innerHTML=
    "😄 Abhi baccha hai...<br>Ja re Student Portal me.";
    setTimeout(function(){
      window.location="student.html";
    },2500);
  }
}
