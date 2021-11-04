//
// ---------- Javascript ------------------------------------
//

// Au chargement de la page
window.addEventListener("beforeunload", function () {
    var container = document.querySelector('.container');
    container.classList.add("animate-out");
});

// A la sortie de la page
document.addEventListener('DOMContentLoaded', function () {
     var container = document.querySelector('.container');
     container.classList.add("animate-in");
});
