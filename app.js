// ===== FIREBASE =====
var firebaseConfig = {
    apiKey: "AIzaSyBQeh3uUSQu69VXyslaqyPQ6cR8eX5M5s4",
    authDomain: "win-29400.firebaseapp.com",
    databaseURL: "https://win-29400-default-rtdb.firebaseio.com",
    projectId: "win-29400",
    storageBucket: "win-29400.firebasestorage.app",
    messagingSenderId: "186236557243",
    appId: "1:186236557243:web:1e26f6848dd917a4cb969e"
};

var scanLock = false; // 🔒 kunci scan

var beepSuccess = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
var beepError = new Audio("https://actions.google.com/sounds/v1/alarms/winding_alarm_clock.ogg");
var beepBeaCukai = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");

firebase.initializeApp(firebaseConfig);
var dbRoot = firebase.database().ref("kantong");

let historyScan = [];

let selectedJudulWin2 = [];


function getDBUser(){

    var role = sessionStorage.getItem("role");
    var mode = sessionStorage.getItem("mode");
    var wilayah = sessionStorage.getItem("wilayah");

    // ADMIN lihat semua
    if(role === "admin"){
        return dbRoot;
    }

    // PETUGAS
    if(role === "petugas"){

        if(mode === "readonly"){
            return dbRoot.child("win2");
        }

        // 🔥 WIN1 & WIN3 (mode normal)
        if(wilayah === "win3"){
            return dbRoot.child("win3");
        }

        return dbRoot.child("win1");
    }

    // USER default
    return dbRoot.child("win1");
}

var db = getDBUser();


// ===== LOGIN TAB =====
function openTab(role){
    document.querySelectorAll(".tab-content").forEach(d => d.style.display="none");
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.getElementById("tab-"+role).style.display = "block";
    document.querySelector(".tab-btn[onclick='openTab(\""+role+"\")']").classList.add("active");
}

// ===== LOGIN FUNCTIONS =====
function loginUser(){
    var user = document.getElementById("usernameUser").value.trim();
    var pass = document.getElementById("passwordUser").value.trim();
    var akunUser = { user1:{password:"123"}, user2:{password:"123"} };
    if(akunUser[user] && akunUser[user].password===pass){
        sessionStorage.setItem("role","user");
        tampilkanHalaman("user");
    } else alert("Username/Password User salah!");
}

function loginAdmin(){
    var user = document.getElementById("usernameAdmin").value.trim();
    var pass = document.getElementById("passwordAdmin").value.trim();
    if(user==="Admin" && pass==="Di2tboit"){
        sessionStorage.setItem("role","admin");
        tampilkanHalaman("admin");
    } else alert("Username/Password Admin salah!");
}

function loginPetugas(){
    var user = document.getElementById("usernamePetugas").value.trim();
    var pass = document.getElementById("passwordPetugas").value.trim();

    if(user==="Win1" && pass==="29400"){
        sessionStorage.setItem("role","petugas");
        sessionStorage.setItem("mode","normal");
        sessionStorage.setItem("wilayah","win1"); // 🔥 TAMBAHAN
        tampilkanHalaman("petugas");
    } 
    else if(user==="Win2" && pass==="29400"){
        sessionStorage.setItem("role","petugas");
        sessionStorage.setItem("mode","readonly");
        sessionStorage.setItem("wilayah","win2"); // 🔥 TAMBAHAN
        tampilkanHalaman("petugas");
    } 
    else if(user==="Win3" && pass==="29400"){ // 🔥 TAMBAHAN
        sessionStorage.setItem("role","petugas");
        sessionStorage.setItem("mode","normal");
        sessionStorage.setItem("wilayah","win3");
        tampilkanHalaman("petugas");
    } 
    else {
        alert("Username/Password Petugas salah!");
    }
}

// ===== TAMPILKAN HALAMAN BERDASARKAN ROLE =====
function tampilkanHalaman(role){

    db = getDBUser(); // 🔥 TAMBAHKAN BARIS INI

    document.getElementById("tombolKeluar").style.display = "none";
    document.getElementById("loginTabSection").style.display = "none";

    var ui = document.getElementById("userInfo");
    ui.style.display = "block";
    document.getElementById("namaUser").innerText = role.toUpperCase();

    // Reset semua class & tampilan
    ui.classList.remove("admin","petugas","user");
    document.getElementById("hapusSemuaBtn").style.display = "none";
    document.getElementById("formAdmin").style.display = "none";
    document.getElementById("formPetugas").style.display = "none";

    document.getElementById("sectionTotal").style.display = "block";
    document.getElementById("sectionFilter").style.display = "block";
    document.getElementById("totalData").style.display = "block";
    document.getElementById("filterKantong").style.display = "block";
    document.querySelector("table").style.display = "table";

    document.getElementById("reader").style.display = "none";
    document.getElementById("status").style.display = "none";
    document.querySelectorAll("h3")[2].style.display = "none"; // Judul Scan

    // ===== ROLE SETTING =====
  if(role === "admin"){
    ui.classList.add("admin");
    document.getElementById("hapusSemuaBtn").style.display = "inline-block";
    document.getElementById("formAdmin").style.display = "block";

    document.getElementById("sectionTotal").style.display = "none";
    document.getElementById("sectionFilter").style.display = "none";
    document.querySelector("table").style.display = "none";
    document.getElementById("filterKantong").style.display = "none";

    loadJudulAdmin(); // 🔥 TAMBAHKAN INI
}

    if(role === "petugas"){

    ui.classList.add("petugas");
    document.getElementById("formPetugas").style.display = "block";

    // Scan aktif untuk petugas
    document.getElementById("reader").style.display = "block";
    document.getElementById("status").style.display = "block";
    document.querySelectorAll("h3")[2].style.display = "block";

    var mode = sessionStorage.getItem("mode");

    // 🔥 KHUSUS WIN2 → SEMBUNYIKAN TABEL SAJA
    if(mode === "readonly"){
        document.querySelector("table").style.display = "none";
        document.querySelectorAll("h3")[4].style.display = "none";
    }
}

    if(role === "user"){
        ui.classList.add("user");

        // Scan aktif untuk user
        document.getElementById("reader").style.display = "block";
        document.getElementById("status").style.display = "block";
        document.querySelectorAll("h3")[2].style.display = "block";
    }

 if(role === "petugas"){

    var dropdown = document.getElementById("filterKantong");

    setTimeout(function(){

        if(dropdown.options.length > 1){
            dropdown.selectedIndex = 1;
        }

        dropdown.disabled = false; // ✅ dropdown tetap bisa dipilih

        filterList();

    }, 500);
	
// 🔥 KHUSUS HISTORY WIN3
var wilayah = sessionStorage.getItem("wilayah");
var historyBox = document.getElementById("historySection");

if(historyBox){
    if(wilayah === "win3"){
        historyBox.style.display = "block";
    } else {
        historyBox.style.display = "none";
    }
}
	
	// ===== KHUSUS WIN3 UBAH TEXT =====
var wilayah = sessionStorage.getItem("wilayah");

if(wilayah === "win3"){

    // TOTAL KANTONG PENGAJUAN → TOTAL CN / RESI DITOLAK BC
    var judulBox = document.querySelector("#infoJudulBox h3");
    if(judulBox){
        judulBox.innerText = "TOTAL CN / RESI TOLAK BC";
    }

    // SCAN KANTONG → SCAN CN / RESI
    var scanJudul = document.querySelectorAll("h3")[2];
    if(scanJudul){
        scanJudul.innerText = "SCAN CN / RESI";
    }

    // INPUT MANUAL NO KANTONG → Input Manual No CN / RESI
    var inputManual = document.getElementById("manualScanPetugas");
    if(inputManual){
        inputManual.placeholder = "Input Manual No CN / RESI";
    }
}
	
}
}
// Sembunyikan tombol keluar setelah login
document.getElementById("tombolKeluar").style.display = "none";


// ===== LOGOUT =====
function logout(){

    // 🔥 HAPUS CACHE TOTAL WIN2 SAAT LOGOUT
    sessionStorage.removeItem("cacheTotalWin2");

    sessionStorage.clear();
    window.location.href = "index.html";
}

// ===== ADMIN FUNCTIONS =====
function uploadKantongAdmin(){
    var kode = document.getElementById("inputKantongAdmin").value.trim();
    var judul = document.getElementById("inputKategoriAdmin").value.trim().toUpperCase();

    if(!kode || !judul){
        alert("Isi No Kantong & Judul!");
        return;
    }

    db.child(judul).child(kode).set(true);

    alert("Data berhasil ditambahkan ke judul " + judul);

    document.getElementById("inputKantongAdmin").value="";
    document.getElementById("inputKategoriAdmin").value="";
}

function ambilStatus(item){

    var mode = sessionStorage.getItem("mode");

    // Jika data lama (boolean true)
    if(typeof item !== "object" || item === null){
        return "OK KANTONG DI TERIMA";
    }

    // Jika mode Win2
    if(mode === "readonly"){
        return (item.status_win2 && item.status_win2 !== "")
            ? item.status_win2
            : "-";
    }

    // Mode normal
    return (item.status && item.status !== "")
        ? item.status
        : "OK KANTONG DI TERIMA";
}

// ===== PETUGAS FUNCTIONS =====
function manualCheckPetugas() {
    let input = document.getElementById("manualScanPetugas").value;

    if (sessionStorage.getItem("wilayah") === "win3") {
    tambahHistory(input);
}
    var kode = document.getElementById("manualScanPetugas").value.trim();
    var judulDipilih = document.getElementById("filterKantong").value;
    if(!kode){
        alert("ISI NO KANTONG DULU !!!!");
        return;
    }
   var mode = sessionStorage.getItem("mode");

// Jika Win2 dan masih ALL → cari ke semua judul
// Jika Win2 dan masih ALL → cari ke semua judul
if(judulDipilih === "all" && mode === "readonly"){


    db.once("value", snap=>{
        var data = snap.val();
        var ditemukan = false;

        if(data){
            for(var judul in data){
                if(data[judul] && data[judul][String(kode).trim()]){
    ditemukan = true;

    var item = data[judul][String(kode).trim()];
    var mode = sessionStorage.getItem("mode");
    var statusText;

    if(mode === "readonly"){
        statusText = item.status_win2 ? item.status_win2 : "-";
    } else {
        statusText = item.status ? item.status : "OK KANTONG DI TERIMA";
    }

   // ===== KHUSUS WIN2 =====

// jika judul dicentang
if(selectedJudulWin2.includes(judul)){

    // kurangi data
    db.child(judul).child(String(kode).trim()).remove();

    console.log("DATA DIKURANGI:", judul);

}else{

    console.log("TIDAK DIKURANGI:", judul);

}

// tampilkan hasil scan
tampilkanStatusScan(kode, statusText);
beepSuccess.play();

// refresh realtime
filterList();

return;
}
            }
        }

        if(!ditemukan){
            beepError.play();
            shakeScreen();
            tampilkanStatusScan(kode, "TIDAK ADA");
        }
    });

    document.getElementById("manualScanPetugas").value="";
    return;
}

// Selain Win2 tetap wajib pilih judul
if(judulDipilih === "all"){
    alert("Pilih judul dulu sebelum proses!");
    return;
}

   db.child(judulDipilih).child(kode).once("value", snap=>{

    var item = snap.val();

    if(item){

    var statusText = ambilStatus(item);
    var mode = sessionStorage.getItem("mode");

    
  var wilayah = sessionStorage.getItem("wilayah");

if(wilayah !== "win3"){
    db.child(judulDipilih).child(kode).remove();
}

    

    tampilkanStatusScan(kode, statusText);
    beepSuccess.play();

        } else {

            beepError.play();
            shakeScreen();
            tampilkanStatusScan(kode, "TIDAK ADA");
        }
    });

    document.getElementById("manualScanPetugas").value="";
}



// ===== SCAN QR =====
function onScanSuccess(decodedText){
	if (sessionStorage.getItem("wilayah") === "win3") {
    tambahHistory(decodedText);
}

  if(scanLock) return; // 🔒 kalau masih jeda, abaikan
    scanLock = true;     // 🔒 aktifkan kunci

    setTimeout(function(){
        scanLock = false; // 🔓 buka lagi setelah 2 detik
    }, 3000); // ⏳ jeda 3 detik (bisa ubah)
    
    var judulDipilih = document.getElementById("filterKantong").value;
    var mode = sessionStorage.getItem("mode");
	
// Jika Win2 dan masih ALL → cari ke semua judul
// Jika Win2 dan masih ALL → cari ke semua judul
if(judulDipilih === "all" && mode === "readonly"){

   

    db.once("value", snap=>{
        var data = snap.val();
        var ditemukan = false;

        if(data){
            for(var judul in data){
                if(data[judul] && data[judul][String(decodedText).trim()]){
                    ditemukan = true;

                    var item = data[judul][decodedText];
                    var statusText = item.status_win2 ? item.status_win2 : "-";

// ===== KHUSUS WIN2 =====

// jika judul dicentang
if(selectedJudulWin2.includes(judul)){

    // kurangi data
    db.child(judul).child(String(decodedText).trim()).remove();

    console.log("DATA DIKURANGI:", judul);

}else{

    console.log("TIDAK DIKURANGI:", judul);

}

tampilkanStatusScan(decodedText, statusText);
beepSuccess.play();

// refresh total realtime
filterList();

return;
                }
            }
        }

        if(!ditemukan){
            beepError.play();
            shakeScreen();
            tampilkanStatusScan(decodedText, "TIDAK ADA");
        }
    });

    return;
}

// Selain Win2 tetap wajib pilih judul
if(judulDipilih === "all"){
    alert("Pilih judul dulu sebelum scan!");
    return;
}

    db.child(judulDipilih).child(decodedText).once("value", snap=>{

    var item = snap.val();

   if(item){

    var statusText = ambilStatus(item);
    var mode = sessionStorage.getItem("mode");

    
    var wilayah = sessionStorage.getItem("wilayah");

if(wilayah !== "win3"){
    db.child(judulDipilih).child(decodedText).remove();
}

    

    tampilkanStatusScan(decodedText, statusText);
    beepSuccess.play();
}   else {


            beepError.play();
            shakeScreen();
            tampilkanStatusScan(decodedText, "TIDAK ADA");
        }
    });
}

var html5QrcodeScanner = new Html5QrcodeScanner("reader",{fps:15,qrbox:300});
html5QrcodeScanner.render(onScanSuccess);



// ===== FILTER LIST & REALTIME =====
function filterList(){
    var filter = document.getElementById("filterKantong").value;
	var mode = sessionStorage.getItem("mode");
    var filter = document.getElementById("filterKantong").value;

// 🔥 KHUSUS WIN2
// ===== KHUSUS PETUGAS =====
if(mode === "readonly"){ 

    // ===== KHUSUS WIN2 =====
    if(filter === "all"){

        document.querySelector("table").style.display = "none";

        // JUDUL TOTAL TETAP MUNCUL
        document.querySelector("#infoJudulBox h3").style.display = "block";

    } else {

        document.querySelector("table").style.display = "table";

        document.querySelector("#infoJudulBox h3").style.display = "block";

    }
}
else if(mode === "normal"){ 
    // 🟢 WIN1
    if(filter === "all"){
        document.querySelector("table").style.display = "none";
        document.querySelectorAll("h3")[4].style.display = "none";
    } else {
        document.querySelector("table").style.display = "table";
        document.querySelectorAll("h3")[4].style.display = "block";
    }
}
    var list = document.getElementById("listKantong");

    if(window.currentRef){
        window.currentRef.off();
    }

    list.innerHTML = "";
    document.getElementById("totalData").innerText = "0";

    var ref = (filter === "all") ? db : db.child(filter);
    window.currentRef = ref;

    // ===== HITUNG TOTAL AWAL =====
    ref.once("value", function(snapshot){

        var total = 0;

        if(filter === "all"){
            snapshot.forEach(function(judulSnap){
                judulSnap.forEach(function(child){
                    total++;
                });
            });
        } else {
            snapshot.forEach(function(child){
                total++;
            });
        }

        document.getElementById("totalData").innerText = total;
    });

    // ===== REALTIME LIST =====
    ref.on("child_added", function(snap){

        if(filter === "all"){

            var judul = snap.key;

            snap.forEach(child=>{
                var kode = child.key;

                var row = document.createElement("tr");
                row.innerHTML = "<td>"+kode+"</td><td>"+judul+"</td>";
                list.appendChild(row);
            });

        } else {

            var kode = snap.key;

            var row = document.createElement("tr");
            row.innerHTML = "<td>"+kode+"</td><td>"+filter+"</td>";
            list.appendChild(row);
        }
    });

    ref.on("child_removed", function(){
        filterList();
    });

    var role = sessionStorage.getItem("role");
var mode = sessionStorage.getItem("mode");

dbRoot.once("value", function(snap){

    var data = snap.val() || {};
    var judulData = {};

    if(role === "admin"){

        if(data.win1){
            Object.keys(data.win1).forEach(function(j){
                judulData[j] = true;
            });
        }

        if(data.win2){
            Object.keys(data.win2).forEach(function(j){
                judulData[j] = true;
            });
        }
    }

    // PETUGAS WIN1
    else if(role === "petugas" && mode === "normal"){

    var wilayah = sessionStorage.getItem("wilayah");

    if(data[wilayah]){
        for(var j in data[wilayah]){
            judulData[j] = true;
        }
    }
}

    // PETUGAS WIN2
    else if(role === "petugas" && mode === "readonly"){

        if(data.win2){
            for(var j in data.win2){
                judulData[j] = true;
            }
        }
    }

    loadDropdownJudul(judulData);

});

tampilkanInfoJudul(filter);

bersihkanJudulKosong();

// KHUSUS WIN2
loadMultiJudulWin2();

}

// ===== HAPUS SEMUA DATA =====
function hapusSemuaData(){

    if(confirm("Yakin ingin menghapus semua data?")){

        dbRoot.child("win1").remove();
        dbRoot.child("win2").remove();

        alert("Semua data WIN1 & WIN2 berhasil dihapus!");

    }
}

// ===== CEK SESSION SAAT RELOAD =====
window.onload=function(){
    var role=sessionStorage.getItem("role");
    if(role){
        tampilkanHalaman(role);
    }
};

// ===== ENTER UNTUK LOGIN & PROSES =====
document.addEventListener("keydown", function(event){

    if(event.key === "Enter"){

        var role = sessionStorage.getItem("role");

        // BELUM LOGIN
        if(!role){
            if(document.getElementById("tab-admin").style.display === "block"){
                loginAdmin();
            }
            else if(document.getElementById("tab-petugas").style.display === "block"){
                loginPetugas();
            }
            else if(document.getElementById("tab-user").style.display === "block"){
                loginUser();
            }
        }

        // SUDAH LOGIN PETUGAS & FOKUS DI INPUT
        else if(role === "petugas" && 
                document.activeElement.id === "manualScanPetugas"){

            manualCheckPetugas();
        }
    }
});

function loadDropdownJudul(data){

    var dropdown = document.getElementById("filterKantong");
    var hapusDropdown = document.getElementById("hapusJudulDropdown");

    var current = dropdown.value;

    dropdown.innerHTML = "<option value='all'>SEMUA DATA KANTONG</option>";
    hapusDropdown.innerHTML = "<option value=''>PILIH JUDUL</option>";

    if(data){
        for(var judul in data){

            dropdown.innerHTML += "<option value='"+judul+"'>"+judul+"</option>";
            hapusDropdown.innerHTML += "<option value='"+judul+"'>"+judul+"</option>";

        }
    }

    dropdown.value = current;
}

function bersihkanJudulKosong(){
    db.once("value", snap=>{
        var data = snap.val();
        if(data){
            for(var judul in data){
                if(!data[judul] || Object.keys(data[judul]).length === 0){
                    db.child(judul).remove();
                }
            }
        }
    });
}

function exportPerJudul(){
    var filter = document.getElementById("filterKantong").value;
    if(filter === "all"){
        alert("Pilih judul dulu!");
        return;
    }

    db.child(filter).once("value", snap=>{
        var data = snap.val();
        if(!data){
            alert("Tidak ada data!");
            return;
        }

        var rows = [];
        for(var kode in data){
            rows.push([kode]);
        }

        var ws = XLSX.utils.aoa_to_sheet(rows);
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, filter);
        XLSX.writeFile(wb, filter + ".xlsx");
    });
}

function hapusPerJudul(){

    var judul = document.getElementById("hapusJudulDropdown").value;
    var target = document.getElementById("targetHapusData").value;

    if(!judul){
        alert("Pilih judul dulu!");
        return;
    }

    if(!confirm("Yakin ingin menghapus data judul " + judul + " ?")){
        return;
    }

    if(target === "win1"){

        dbRoot.child("win1").child(judul).remove();
        alert("Data judul " + judul + " berhasil dihapus dari WIN1!");

    }

    else if(target === "win2"){

        dbRoot.child("win2").child(judul).remove();
        alert("Data judul " + judul + " berhasil dihapus dari WIN2!");

    }
	
	else if(target === "win3"){

    dbRoot.child("win3").child(judul).remove();
    alert("Data judul " + judul + " berhasil dihapus dari WIN3!");

    }

    else if(target === "all"){

    dbRoot.child("win1").child(judul).remove();
    dbRoot.child("win2").child(judul).remove();
    dbRoot.child("win3").child(judul).remove(); // 🔥 TAMBAHAN

    alert("Data judul " + judul + " berhasil dihapus dari WIN1, WIN2 & WIN3!");

}

    filterList();
}

function shakeScreen(){
    document.body.classList.add("mega-shake-red");

    setTimeout(function(){
        document.body.classList.remove("mega-shake-red");
    }, 900);
}

function keluarAplikasi(){
    document.body.style.opacity = "0";
    document.body.style.transition = "0.5s";

    setTimeout(function(){
        window.location.href = "https://di2tboit81.github.io/ESP-POSIND/";
    }, 500);
}

// ===== VERSI BARU UPLOAD EXCEL DENGAN KETERANGAN =====
function uploadExcelAdmin(){

    var fileInput = document.getElementById("fileExcelAdmin");
    var file = fileInput.files[0];

    if(!file){
        alert("Pilih file dulu!");
        return;
    }

    var target = document.getElementById("targetUploadExcel").value;

    var judul = prompt("Masukkan Judul Data (contoh: SPX_15MEI):");

    if(!judul){
        alert("Judul harus diisi!");
        return;
    }

    judul = judul.toUpperCase();

    var reader = new FileReader();

    reader.onload = function(e){

        var data = new Uint8Array(e.target.result);
        var workbook = XLSX.read(data,{type:'array'});
        var sheet = workbook.Sheets[workbook.SheetNames[0]];
        var rows = XLSX.utils.sheet_to_json(sheet,{header:1});

        var count = 0;

        rows.forEach((r,index)=>{

            if(index<1) return;

            var kode = r[0];
            var keterangan = r[1] || "";
            var keteranganWin2 = r[2] || "";
            var infoJudul = r[3] || "";

            if(!kode) return;

            var dataObj = {
                status:keterangan,
                status_win2:keteranganWin2,
                infoJudul:infoJudul
            };
if(target === "all"){

    dbRoot.child("win1").child(judul).child(kode).set(dataObj);
    dbRoot.child("win2").child(judul).child(kode).set(dataObj);
    dbRoot.child("win3").child(judul).child(kode).set(dataObj); // 🔥 TAMBAHAN

}else{

    dbRoot.child(target).child(judul).child(kode).set(dataObj);

}

            count++;

        });

        alert(count+" data berhasil diupload ke "+target);

        fileInput.value="";
        filterList();

    };

    reader.readAsArrayBuffer(file);
}

function normalizeStatus(text){
    if(!text) return "";

    return text
        .toString()
        .replace(/\s+/g," ")
        .replace(/\n/g,"")
        .replace(/\r/g,"")
        .trim()
        .toUpperCase();
}

function tampilkanStatusScan(kode, statusText){

    var mode = sessionStorage.getItem("mode");
    var isWin2 = (mode === "readonly");

    var statusFix = normalizeStatus(statusText);

    var htmlOutput = "<div style='margin-top:15px;'>";

    htmlOutput += "<div style='font-weight:900;font-size:" + 
              (isWin2 ? "35px" : "18px") + 
              ";margin-bottom:15px;'>"  
                  + kode + "</div>";

    if(statusFix === "OK KANTONG DI TERIMA"){

        htmlOutput += 
        "<span class='success'>✅ OK KANTONG SUDAH DI TERIMA</span>";

        beepSuccess.play();
    }

    else if(statusFix.includes("TOLAK BEA CUKAI")){

        htmlOutput += 
        "<span class='orange-error'>⚠️ ERROR KANTONG DI TOLAK BEA CUKAI</span>";

        beepBeaCukai.play();

        document.body.classList.add("mega-shake-red");

        setTimeout(function(){
            document.body.classList.remove("mega-shake-red");
        }, 5000);
    }

    else if(statusFix === "TIDAK ADA"){

        htmlOutput += 
        "<span class='error'>❌ KANTONG TIDAK TERDAFTAR</span>";

        beepError.play();
        shakeScreen();
    }

    else{

        htmlOutput += 
        "<span class='success'>ℹ️ " + statusText + "</span>";

        beepSuccess.play();
    }

    htmlOutput += "</div>";

    document.getElementById("status").innerHTML = htmlOutput;
}



function tampilkanInfoJudul(judul){

    var box = document.getElementById("infoJudulBox");
    var text = document.getElementById("infoJudulText");
    var title = document.querySelector("#infoJudulBox h3");

    var wilayah = sessionStorage.getItem("wilayah");

    // ===== KHUSUS WIN2 SAAT ALL =====
// ===== KHUSUS WIN2 SAAT ALL =====
if(judul === "all" && wilayah === "win2"){
	// 🔥 SEMBUNYIKAN BOX KHUSUS WIN2 SAAT ALL
box.style.display = "none";
return;

   

    // kalau belum ada → hitung dari database
    db.once("value", function(snapshot){

        var total = 0;

        snapshot.forEach(function(judulSnap){

            judulSnap.forEach(function(child){
                total++;
            });

        });

        // 🔥 SIMPAN TOTAL AWAL
        sessionStorage.setItem("cacheTotalWin2", total);

        text.innerHTML = `
            <div style="
                font-size:100px;
                font-weight:bold;
                color:#00ffae;
                text-align:center;
            ">
                ${total}
            </div>
        `;

        box.style.display = "block";

    });

    return;
}

    // ===== DEFAULT =====
    if(judul === "all"){
        box.style.display = "none";
        text.innerText = "-";
        return;
    }

    db.child(judul).once("value", function(snapshot){

        var data = snapshot.val();
        var info = "-";

        if(data){
            for(var kode in data){

                if(typeof data[kode] === "object" && data[kode].infoJudul){
                    info = data[kode].infoJudul;
                    break;
                }
            }
        }

        title.innerText = "TOTAL KANTONG PENGAJUAN";

        text.innerText = info;
        box.style.display = "block";
    });
}

function loadJudulAdmin(){

    var hapusDropdown = document.getElementById("hapusJudulDropdown");
    var target = document.getElementById("targetHapusData").value;

    hapusDropdown.innerHTML = "<option value=''>PILIH JUDUL</option>";

    dbRoot.once("value", function(snapshot){

        var data = snapshot.val();

        if(!data) return;

        // ===== WIN1 =====
        if(target === "win1" && data.win1){
            for(var j in data.win1){
                hapusDropdown.innerHTML += "<option value='"+j+"'>"+j+"</option>";
            }
        }

        // ===== WIN2 =====
        else if(target === "win2" && data.win2){
            for(var j in data.win2){
                hapusDropdown.innerHTML += "<option value='"+j+"'>"+j+"</option>";
            }
        }
		
		else if(target === "win3" && data.win3){
    for(var j in data.win3){
        hapusDropdown.innerHTML += "<option value='"+j+"'>"+j+"</option>";
    }
}

        // ===== ALL =====
        else if(target === "all"){

            var judulSet = {};

            if(data.win1){
                for(var j in data.win1){
                    judulSet[j] = true;
                }
            }

            if(data.win2){
                for(var j in data.win2){
                    judulSet[j] = true;
                }
            }
			
			if(data.win3){
    for(var j in data.win3){
        judulSet[j] = true;
    }
}

            for(var j in judulSet){
                hapusDropdown.innerHTML += "<option value='"+j+"'>"+j+"</option>";
            }
        }

    });

}

function autoScanManual(){

    var input = document.getElementById("manualScanPetugas");
    var kode = input.value.trim();

    // jika panjang kode sudah cukup (scanner biasanya langsung panjang)
    if(kode.length >= 16){

        setTimeout(function(){

            if(input.value.trim() !== ""){
                manualCheckPetugas();
            }

        },200);
    }
}

/* ===== ANTI INSPECT ===== */

document.addEventListener('contextmenu', function(e){
    e.preventDefault();
});

document.onkeydown = function(e){

    // F12
    if(e.keyCode == 123){
        return false;
    }

    // CTRL + SHIFT + I
    if(e.ctrlKey && e.shiftKey && e.keyCode == 73){
        return false;
    }

    // CTRL + SHIFT + J
    if(e.ctrlKey && e.shiftKey && e.keyCode == 74){
        return false;
    }

    // CTRL + U
    if(e.ctrlKey && e.keyCode == 85){
        return false;
    }

    // CTRL + SHIFT + C
    if(e.ctrlKey && e.shiftKey && e.keyCode == 67){
        return false;
    }

};


document.onselectstart = function(e){

    if(e.target.closest("#listKantong")){
        return true;
    }

    return false;
};


(function(){

function detectDevTools(){

    const start = new Date();

    debugger;

    const end = new Date();

    if(end - start > 100){

        document.body.innerHTML =
        "<h1 style='color:red;text-align:center;margin-top:100px;'>SECURITY BLOCKED</h1>";

    }

}

setInterval(detectDevTools,1000);

})();

// ===== KLIK NOMOR KANTONG AUTO COPY =====
document.addEventListener("click", function(e){

    if(e.target.tagName === "TD" && e.target.parentElement.parentElement.id === "listKantong"){

        var teks = e.target.innerText;

        navigator.clipboard.writeText(teks).then(function(){

            // efek notifikasi kecil
            e.target.style.background = "#00c896";

            setTimeout(function(){
                e.target.style.background = "";
            },500);

        });

    }


});

function tambahHistory(resi) {

    // 🔒 HANYA WIN3
    if (sessionStorage.getItem("wilayah") !== "win3") return;

    historyScan.push(resi);

    let li = document.createElement("li");
    li.textContent = resi;
    document.getElementById("historyList").appendChild(li);
}

function hapusHistory() {

    // 🔒 HANYA WIN3
    if (sessionStorage.getItem("wilayah") !== "win3") {
        alert("Fitur hanya untuk WIN3");
        return;
    }

    if (!confirm("Yakin hapus semua history?")) return;

    let judulDipilih = document.getElementById("filterKantong").value;

    if (judulDipilih === "all") {
        alert("Pilih judul dulu!");
        return;
    }

    historyScan.forEach(resi => {
        db.child(judulDipilih).child(resi).remove();
    });

    historyScan = [];
    document.getElementById("historyList").innerHTML = "";

    filterList(); // 🔥 refresh total & list
}

function tambahKembaliKeList(resi) {
    let tbody = document.getElementById("listKantong");

    let tr = document.createElement("tr");
    tr.innerHTML = `<td>${resi}</td><td>-</td>`;

    tbody.appendChild(tr);
}

function updateTotal() {
    let total = document.getElementById("listKantong").children.length;
    document.getElementById("totalData").innerText = total;
}

/* =========================================
   MODE KHUSUS WIN2
========================================= */

let modeWin2 = ""; // belum pilih mode

function tampilkanModeWin2(){

    const box = document.getElementById("modeWin2Box");

    if(box){
        box.style.display = "none";
    }

}
/* =========================
   TOMBOL MODE
========================= */

function setModeCheck(){

    modeWin2 = "check";

    document.getElementById("btnOnCheck").style.opacity = "1";
    document.getElementById("btnSortir").style.opacity = "0.5";

    showNotif("MODE ON CHECK AKTIF");

}

function setModeSortir(){

    modeWin2 = "sortir";

    document.getElementById("btnOnCheck").style.opacity = "0.5";
    document.getElementById("btnSortir").style.opacity = "1";

    showNotif("MODE SORTIR AKTIF");

}

/* =========================
   NOTIF KECIL
========================= */

function showNotif(text){

    let notif = document.createElement("div");

    notif.innerText = text;

    notif.style.position = "fixed";

    // 🔥 posisi tengah
    notif.style.top = "50%";
    notif.style.left = "50%";
    notif.style.transform = "translate(-50%, -50%)";

    notif.style.background = "rgba(0,0,0,0.85)";
    notif.style.color = "#00ffcc";

    notif.style.padding = "10px 18px";
    notif.style.borderRadius = "8px";

    notif.style.zIndex = "99999";

    notif.style.fontWeight = "bold";
    notif.style.fontSize = "16px";

    notif.style.boxShadow = "0 0 10px #00ffcc";

    document.body.appendChild(notif);

    setTimeout(()=>{
        notif.remove();
    },1500);

}

/* =========================
   PANGGIL SAAT LOGIN
========================= */

/* =========================================
   MULTI PILIH PENGAJUAN WIN2
========================================= */

function loadMultiJudulWin2(){

    const wilayah = sessionStorage.getItem("wilayah");

    const box = document.getElementById("multiJudulBox");
    const list = document.getElementById("multiJudulList");
    const filter = document.getElementById("filterKantong");

    if(!box || !list || !filter) return;

    // hanya WIN2 + SEMUA DATA
    if(wilayah !== "win2" || filter.value !== "all"){

        box.style.display = "none";
        return;
    }

    box.style.display = "block";

    db.once("value", snap=>{

        let data = snap.val();

        list.innerHTML = "";

        if(!data) return;

        Object.keys(data).forEach(judul=>{

            const checked =
            selectedJudulWin2.includes(judul)
            ? "checked"
            : "";

            list.innerHTML += `
            <label style="
                display:flex;
                align-items:center;
                gap:10px;
                margin-bottom:8px;
                cursor:pointer;
            ">

            <input
                type="checkbox"
                value="${judul}"
                ${checked}
                onchange="toggleJudulWin2(this)"
            >

            ${judul}

            </label>
            `;

        });

    });

}

function toggleJudulWin2(el){

    const val = el.value;

    if(el.checked){

        if(!selectedJudulWin2.includes(val)){
            selectedJudulWin2.push(val);
        }

    }else{

        selectedJudulWin2 =
        selectedJudulWin2.filter(x=>x !== val);

    }

    console.log("JUDUL AKTIF:", selectedJudulWin2);

}
