import { Viewpoint } from './Viewpoint';
import { Track } from './Track';
import './assets/kungsholmen_2010-04-30.tcx';
import './assets/kungsholmen_2010-05-03.tcx';
import './assets/kungsholmen_2010-06-20.tcx';
import './assets/kungsholmen_2010-06-23.tcx';
import './assets/kungsholmen_2010-12-12.tcx';
import './assets/kungsholmen_2011-01-07.tcx';
import './style.css';
import { View } from './View';



document.getElementById('route1').addEventListener('click', () => loadTrack('assets/kungsholmen_2010-04-30.tcx'));
document.getElementById('route2').addEventListener('click', () => loadTrack('assets/kungsholmen_2010-05-03.tcx'));
document.getElementById('route3').addEventListener('click', () => loadTrack('assets/kungsholmen_2010-06-20.tcx'));
document.getElementById('route4').addEventListener('click', () => loadTrack('assets/kungsholmen_2010-06-23.tcx'));
document.getElementById('route5').addEventListener('click', () => loadTrack('assets/kungsholmen_2010-12-12.tcx'));
document.getElementById('route6').addEventListener('click', () => loadTrack('assets/kungsholmen_2011-01-07.tcx'));
document.getElementById('loadMany').addEventListener('click', () => loadManyRoutes());
document.getElementById('draw').addEventListener('click', () => view.draw(100, 50, 1300, 800, addedTracks));
document.getElementById('draw3d').addEventListener('click', () => view.draw3d(100, 50, 1300, 800, addedTracks));

document.getElementById('increaseElevation').addEventListener('click', () => increaseElevation());
document.getElementById('decreaseElevation').addEventListener('click', () => decreaseElevation());
document.getElementById('anticlockwise').addEventListener('click', () => rotateAnticlockwise());
document.getElementById('clockwise').addEventListener('click', () => rotateClockwise());



const addedTracks: Track[] = [];
const view: View = new View();

function loadTrack(filnamnet: string): void {
    fetch(filnamnet)
        .then(response => response.text())
        .then(data => {
            const parser: DOMParser = new DOMParser();
            const xmlDoc: Document = parser.parseFromString(data, 'application/xml');
            const track: Track = new Track(xmlDoc);
            addedTracks.push(track);
        })
        .catch(error => {
            console.log(error);
        });
}



function increaseElevation(): void {
    view.increaseElevation();
    view.draw3d(100, 50, 1300, 800, addedTracks);
}

function decreaseElevation(): void {
    view.decreaseElevation();
    view.draw3d(100, 50, 1300, 800, addedTracks);
}

function rotateClockwise(): void {
    view.rotateClockwise();
    view.draw3d(100, 50, 1300, 800, addedTracks);
}

function rotateAnticlockwise(): void {
    view.rotateAnticlockwise();
    view.draw3d(100, 50, 1300, 800, addedTracks);
}


// //r�knar ut ett viktat med utifr�n en punkt och dess tv� n�rmaste punkter
// //input v�rde-array och datum-array
// //output nya v�rde-arrayen
// function viktad_medel(v_array, d_array) {
//     let temp_vektor = [];
//     //f�rsta v�rdet i nya arrayen r�knas fr�n tv� v�rden
//     temp_vektor.push((v_array[0] * 1 + v_array[1] * 1) / 2);
//     //r�knar ut medelv�rde f�r alla punkter i nya arrayen f�rutom f�rsta och sista
//     for (let u: number = 1; u < v_array.length - 1; u++) {
//         //hur m�nga dagar �r det mellan xa-x0 och x0-xb
//         dagdiff1 = dagdiffaren(d_array[u], d_array[u - 1]);
//         dagdiff2 = dagdiffaren(d_array[u + 1], d_array[u]);
//         //hur m�nga dagar mellan xa-xb
//         heldagdiff = dagdiff1 + dagdiff2;
//         //r�knar ut viktade medelv�rdet
//         temp_vektor.push((v_array[u - 1] * dagdiff2 / heldagdiff + v_array[u] * 1 + v_array[u + 1] * dagdiff1 / heldagdiff) / 2);
//     }
//     //r�knar ut medelv�rde f�r sista punkten i nya arrayen mha v�rden fr�n tv� punkter
//     temp_vektor.push((v_array[v_array.length - 1] * 1 + v_array[v_array.length - 2] * 1) / 2);

//     return temp_vektor;
// }











function loadManyRoutes(): void {
    loadTrack('assets/kungsholmen_2010-04-30.tcx');
    loadTrack('assets/kungsholmen_2010-05-03.tcx');
    loadTrack('assets/kungsholmen_2010-06-20.tcx');
    loadTrack('assets/kungsholmen_2010-06-23.tcx');
    loadTrack('assets/kungsholmen_2010-12-12.tcx');
    loadTrack('assets/kungsholmen_2011-01-07.tcx');
}

