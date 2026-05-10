(function() {
'use strict';

// ===== KONFIGURASI =====
const TEMPLATE_URL = "https://files.catbox.moe/w4jbav.jpg";
const DEFAULT_PHOTO_URL = "";
const WA_LINK = "https://whatsapp.com/channel/0029Vb7sv8qFcovxf4EHMj2G";
const MUSIC_URL = "https://files.catbox.moe/n0hdj7.m4a";
const VIDEO_URL = "https://files.catbox.moe/your-video.mp4"; // Ganti dengan URL video Anda

// ===== ELEMEN DOM =====
const canvas = document.getElementById("ktpCanvas");
const ctx = canvas.getContext("2d");
const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");
const photoUrlInput = document.getElementById("photoUrl");
const loadUrlBtn = document.getElementById("loadUrlBtn");
const generateBtn = document.getElementById("generateBtn");
const saveBtn = document.getElementById("saveBtn");
const shareBtn = document.getElementById("shareBtn");
const ktpWrapper = document.getElementById("ktpWrapper");
const zoomModal = document.getElementById("zoomModal");
const zoomImage = document.getElementById("zoomImage");
const closeZoom = document.getElementById("closeZoom");
const musicBtn = document.getElementById("musicBtn");
const bgMusic = document.getElementById("bgMusic");
const waLink = document.getElementById("waLink");
const bgVideo = document.getElementById("bgVideo");
const bgVideoWeb = document.getElementById("bgVideoWeb");

// ===== SET WA LINK =====
if (waLink) waLink.href = WA_LINK;

// ===== STATE =====
let templateImage = null;
let userPhotoImage = null;
let musicPlaying = false;
let videoUnmuted = false;

// Zoom state
let currentZoom = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;
let initialPinchDistance = 0;
let initialZoom = 1;
let initialTranslateX = 0;
let initialTranslateY = 0;
let pinchMidX = 0;
let pinchMidY = 0;

// ===== FIELD REFS =====
const fields = {
    nik: document.getElementById("nik"),
    nama: document.getElementById("nama"),
    ttl: document.getElementById("ttl"),
    jenis_kelamin: document.getElementById("jenis_kelamin"),
    golongan_darah: document.getElementById("golongan_darah"),
    alamat: document.getElementById("alamat"),
    rt_rw: document.getElementById("rt_rw"),
    kel_desa: document.getElementById("kel_desa"),
    kecamatan: document.getElementById("kecamatan"),
    agama: document.getElementById("agama"),
    status: document.getElementById("status"),
    pekerjaan: document.getElementById("pekerjaan"),
    kewarganegaraan: document.getElementById("kewarganegaraan"),
    provinsi: document.getElementById("provinsi"),
    kota: document.getElementById("kota"),
    masa_berlaku: document.getElementById("masa_berlaku"),
    terbuat: document.getElementById("terbuat")
};

// ===== LOAD TEMPLATE =====
function loadTemplate() {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = TEMPLATE_URL;
        img.onload = function() {
            templateImage = img;
            resolve(img);
        };
        img.onerror = function() {
            reject(new Error("Gagal memuat template KTP."));
        };
    });
}

// ===== LOAD PHOTO =====
function loadPhotoFromUrl(url) {
    return new Promise((resolve, reject) => {
        if (!url || url.trim() === "") {
            reject(new Error("URL kosong"));
            return;
        }
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = url;
        img.onload = function() {
            userPhotoImage = img;
            photoPreview.src = url;
            photoPreview.style.display = "block";
            resolve(img);
        };
        img.onerror = function() {
            reject(new Error("Gagal memuat foto dari URL."));
        };
    });
}

function loadDefaultPhoto() {
    if (DEFAULT_PHOTO_URL && DEFAULT_PHOTO_URL.trim() !== "") {
        loadPhotoFromUrl(DEFAULT_PHOTO_URL).catch(function() {
            userPhotoImage = null;
        });
    } else {
        userPhotoImage = null;
    }
}

// ===== VIDEO HANDLING =====
function setupVideoLooping() {
    // Setup video header looping
    if (bgVideo) {
        bgVideo.addEventListener('ended', function() {
            this.currentTime = 0;
            this.play();
        }, false);
        
        bgVideo.addEventListener('pause', function() {
            if (!this.ended && !this.paused) {
                this.play();
            }
        });
    }
    
    // Setup video background looping
    if (bgVideoWeb) {
        bgVideoWeb.addEventListener('ended', function() {
            this.currentTime = 0;
            this.play();
        }, false);
        
        bgVideoWeb.addEventListener('pause', function() {
            if (!this.ended && !this.paused) {
                this.play();
            }
        });
    }
}

// ===== URL INPUT HANDLING =====
photoUrlInput.value = DEFAULT_PHOTO_URL;
photoUrlInput.addEventListener("focus", function() {
    if (this.value === DEFAULT_PHOTO_URL) {
        this.value = "";
    }
});
photoUrlInput.addEventListener("blur", function() {
    if (this.value.trim() === "") {
        this.value = DEFAULT_PHOTO_URL;
    }
});

// ===== FILE UPLOAD =====
photoInput.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        const img = new Image();
        img.src = ev.target.result;
        img.onload = function() {
            userPhotoImage = img;
            photoPreview.src = ev.target.result;
            photoPreview.style.display = "block";
            photoUrlInput.value = "";
            if (templateImage) drawKTP();
        };
    };
    reader.readAsDataURL(file);
});

// ===== LOAD URL BUTTON =====
loadUrlBtn.addEventListener("click", function() {
    const url = photoUrlInput.value.trim();
    if (!url) {
        alert("Masukkan link foto terlebih dahulu.");
        return;
    }
    loadPhotoFromUrl(url)
        .then(function() {
            if (templateImage) drawKTP();
        })
        .catch(function() {
            alert("Gagal memuat foto dari link. Pastikan URL valid.");
        });
});

// ===== DRAW KTP =====
function drawKTP() {
    if (!templateImage) {
        alert("Template belum dimuat. Tunggu sebentar...");
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);

    const prov = (fields.provinsi.value || " ").toUpperCase();
    const kota = (fields.kota.value || " ").toUpperCase();
    const nik = fields.nik.value || " ";
    const nama = (fields.nama.value || " ").toUpperCase();
    const ttl = (fields.ttl.value || " ").toUpperCase();
    const jenisKelamin = (fields.jenis_kelamin.value || " ").toUpperCase();
    const golDarah = (fields.golongan_darah.value || " ").toUpperCase();
    const alamat = (fields.alamat.value || " ").toUpperCase();
    const rtRw = (fields.rt_rw.value || " ").toUpperCase();
    const kelDesa = (fields.kel_desa.value || " ").toUpperCase();
    const kecamatan = (fields.kecamatan.value || " ").toUpperCase();
    const agama = (fields.agama.value || " ").toUpperCase();
    const status = (fields.status.value || " ").toUpperCase();
    const pekerjaan = (fields.pekerjaan.value || " ").toUpperCase();
    const kewarganegaraan = (fields.kewarganegaraan.value || " ").toUpperCase();
    const masaBerlaku = (fields.masa_berlaku.value || " ").toUpperCase();
    const terbuat = (fields.terbuat.value || " ").toUpperCase();
    const sign = nama.trim().split(/\s+/)[0] || " ";

    ctx.fillStyle = "black";

    ctx.font = "bold 23px 'Segoe UI', 'Arial', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PROVINSI " + prov, 380, 53);
    ctx.fillText("KOTA " + kota, 380, 78);

    ctx.font = "30px 'Courier New', monospace";
    ctx.textAlign = "left";
    ctx.fillText(nik, 165, 112);

    ctx.font = "15px 'Segoe UI', 'Arial', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(nama, 170, 138);
    ctx.fillText(ttl, 170, 156);
    ctx.fillText(jenisKelamin, 170, 175);
    ctx.fillText(golDarah, 413, 174);

    ctx.fillText(alamat, 170, 194);
    ctx.fillText(rtRw, 170, 214);
    ctx.fillText(kelDesa, 170, 233);
    ctx.fillText(kecamatan, 170, 252);
    ctx.fillText(agama, 170, 271);
    ctx.fillText(status, 170, 290);
    ctx.fillText(pekerjaan, 170, 310);
    ctx.fillText(kewarganegaraan, 170, 328);
    ctx.fillText(masaBerlaku, 170, 348);

    ctx.font = "15px 'Segoe UI', 'Arial', sans-serif";
    ctx.fillText("KOTA " + kota, 470, 320);
    ctx.fillText(terbuat, 473, 335);

    ctx.font = "38px 'Brush Script MT', 'Comic Sans MS', cursive";
    ctx.fillText(sign, 490, 377);

    if (userPhotoImage) {
        const photoW = 158;
        const photoH = 200;
        const photoX = 467;
        const photoY = 100;

        const imgRatio = userPhotoImage.width / userPhotoImage.height;
        const targetRatio = photoW / photoH;

        let sw = userPhotoImage.width;
        let sh = userPhotoImage.height;
        let sx = 0;
        let sy = 0;

        if (imgRatio > targetRatio) {
            sw = userPhotoImage.height * targetRatio;
            sx = (userPhotoImage.width - sw) / 2;
        } else {
            sh = userPhotoImage.width / targetRatio;
            sy = (userPhotoImage.height - sh) / 2;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(photoX, photoY, photoW, photoH);
        ctx.clip();
        ctx.drawImage(userPhotoImage, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
        ctx.restore();
    } else {
        ctx.font = "11px Arial";
        ctx.fillStyle = "#444";
        ctx.fillText("[foto belum diunggah]", 495, 190);
        ctx.fillStyle = "black";
    }
}

// ===== ZOOM FUNCTIONS =====
function openZoom() {
    const dataURL = canvas.toDataURL("image/jpeg", 0.95);
    zoomImage.src = dataURL;
    zoomModal.classList.add("active");
    currentZoom = 1;
    translateX = 0;
    translateY = 0;
    applyTransform();
}

function closeZoomModal() {
    zoomModal.classList.remove("active");
}

function applyTransform() {
    zoomImage.style.transform = "scale(" + currentZoom + ") translate(" + translateX + "px, " + translateY + "px)";
}

function getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function getTouchMidpoint(touches) {
    return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2
    };
}

// Mouse drag
zoomImage.addEventListener("mousedown", function(e) {
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    zoomImage.style.cursor = "grabbing";
    e.preventDefault();
});

window.addEventListener("mousemove", function(e) {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    applyTransform();
});

window.addEventListener("mouseup", function() {
    if (isDragging) {
        isDragging = false;
        zoomImage.style.cursor = "grab";
    }
});

// Scroll zoom
zoomImage.addEventListener("wheel", function(e) {
    e.preventDefault();
    var delta = e.deltaY;
    if (delta < 0) {
        currentZoom = Math.min(currentZoom + 0.1, 5);
    } else {
        currentZoom = Math.max(currentZoom - 0.1, 0.5);
    }
    applyTransform();
});

// Touch events
zoomImage.addEventListener("touchstart", function(e) {
    var touches = e.touches;
    if (touches.length === 1) {
        isDragging = true;
        startX = touches[0].clientX - translateX;
        startY = touches[0].clientY - translateY;
    } else if (touches.length === 2) {
        isDragging = false;
        initialPinchDistance = getTouchDistance(touches);
        initialZoom = currentZoom;
        initialTranslateX = translateX;
        initialTranslateY = translateY;
        var mid = getTouchMidpoint(touches);
        pinchMidX = mid.x;
        pinchMidY = mid.y;
    }
});

window.addEventListener("touchmove", function(e) {
    if (!zoomModal.classList.contains("active")) return;
    var touches = e.touches;
    if (touches.length === 1 && isDragging) {
        translateX = touches[0].clientX - startX;
        translateY = touches[0].clientY - startY;
        applyTransform();
    } else if (touches.length === 2) {
        var newDistance = getTouchDistance(touches);
        var mid = getTouchMidpoint(touches);
        var scale = newDistance / initialPinchDistance;
        currentZoom = Math.min(Math.max(initialZoom * scale, 0.5), 5);
        var zoomRatio = currentZoom / initialZoom;
        translateX = (initialTranslateX - pinchMidX) * zoomRatio + mid.x;
        translateY = (initialTranslateY - pinchMidY) * zoomRatio + mid.y;
        applyTransform();
    }
}, { passive: false });

window.addEventListener("touchend", function() {
    isDragging = false;
});

// Klik wrapper untuk zoom
ktpWrapper.addEventListener("click", function() {
    if (templateImage) openZoom();
});

closeZoom.addEventListener("click", closeZoomModal);

zoomModal.addEventListener("click", function(e) {
    if (e.target === zoomModal) closeZoomModal();
});

document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && zoomModal.classList.contains("active")) {
        closeZoomModal();
    }
});

// ===== MUSIC & VIDEO CONTROL =====
musicBtn.addEventListener("click", function() {
    var musicText = this.querySelector('.music-text');
    
    if (!bgVideo) {
        alert("Video background tidak ditemukan");
        return;
    }
    
    if (videoUnmuted) {
        // Mute video
        bgVideo.muted = true;
        if (bgVideoWeb) bgVideoWeb.muted = true;
        musicText.textContent = "Play";
        this.classList.remove("playing");
    } else {
        // Unmute video
        bgVideo.muted = false;
        if (bgVideoWeb) bgVideoWeb.muted = false;
        bgVideo.play().catch(function(error) {
            console.error("Error playing video:", error);
            bgVideo.play();
        });
        if (bgVideoWeb) {
            bgVideoWeb.play().catch(function(error) {
                console.error("Error playing bg video:", error);
            });
        }
        musicText.textContent = "Stop";
        this.classList.add("playing");
    }
    videoUnmuted = !videoUnmuted;
});

// ===== GENERATE & SAVE =====
generateBtn.addEventListener("click", function() {
    if (!templateImage) {
        alert("Template sedang dimuat, tunggu sebentar...");
        return;
    }
    drawKTP();
});

saveBtn.addEventListener("click", function() {
    if (!templateImage) {
        alert("Belum ada gambar untuk disimpan. Generate terlebih dahulu.");
        return;
    }
    drawKTP();
    var dataURL = canvas.toDataURL("image/jpeg", 0.95);
    var link = document.createElement("a");
    var namaFile = (fields.nama.value || 'simulasi').replace(/\s+/g, '');
    link.download = "E-KTP_" + namaFile + ".jpg";
    link.href = dataURL;
    link.click();
});

// ===== SHARE WA =====
shareBtn.addEventListener("click", function() {
    if (!templateImage) {
        alert("Generate KTP terlebih dahulu.");
        return;
    }
    drawKTP();
    var nama = fields.nama.value || "Tidak diketahui";
    var nik = fields.nik.value || "Tidak diketahui";
    var message = encodeURIComponent("✅ E-KTP Simulasi\n\nNama: " + nama + "\nNIK: " + nik + "\n\n📸 Gambar KTP terlampir");
    var waUrl = WA_LINK + "?text=" + message;
    window.open(waUrl, "_blank");
});

// ===== API / BOT WA =====
window.generateKTPFromAPI = function(data) {
    if (!templateImage) {
        console.warn("Template belum dimuat.");
        return null;
    }
    if (data.nik) fields.nik.value = data.nik;
    if (data.nama) fields.nama.value = data.nama;
    if (data.ttl) fields.ttl.value = data.ttl;
    if (data.alamat) fields.alamat.value = data.alamat;
    if (data.fotoUrl) {
        loadPhotoFromUrl(data.fotoUrl).then(function() {
            if (templateImage) drawKTP();
        }).catch(function() {
            console.warn("Gagal load foto dari API");
        });
    }
    drawKTP();
    return canvas.toDataURL("image/jpeg", 0.95);
};

// ===== PARTICLES =====
function initParticles() {
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';
    script.onload = function() {
        if (typeof particlesJS !== 'undefined') {
            particlesJS('particles-js', {
                "particles": {
                    "number": { "value": 60, "density": { "enable": true, "value_area": 800 } },
                    "color": { "value": ["#0a7aff", "#4aa3ff", "#00d4ff"] },
                    "shape": { "type": "circle" },
                    "opacity": { "value": 0.3, "random": true },
                    "size": { "value": 3, "random": true },
                    "line_linked": { "enable": true, "distance": 150, "color": "#0a7aff", "opacity": 0.15, "width": 1 },
                    "move": { "enable": true, "speed": 2, "direction": "none", "random": true, "straight": false }
                },
                "interactivity": {
                    "detect_on": "canvas",
                    "events": { "onhover": { "enable": true, "mode": "grab" } },
                    "modes": { "grab": { "distance": 200, "line_linked": { "opacity": 0.4 } } }
                }
            });
        }
    };
    document.head.appendChild(script);
}

// ===== INIT =====
window.addEventListener("load", function() {
    loadTemplate()
        .then(function() {
            loadDefaultPhoto();
            drawKTP();
            setupVideoLooping();
            initParticles();
        })
        .catch(function(error) {
            alert(error.message);
            ctx.font = "16px Arial";
            ctx.fillStyle = "red";
            ctx.fillText("Gagal memuat template.", 200, 200);
        });
});

})();
