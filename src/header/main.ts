function main(): void {
    document.getElementById("menuButton")!!.onclick = () => document.querySelector("nav")!!.classList.toggle("visible");

    for(let dropdown of document.querySelectorAll<HTMLLIElement>("li.dropdown")){
        dropdown.querySelector("a")!!.onclick = (event) => {
            if(window.innerWidth < 875){
                event.preventDefault();
                dropdown.classList.toggle("visible");
            }
        };
    }
}

window.addEventListener("load", main);
