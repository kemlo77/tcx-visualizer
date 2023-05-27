import { Viewpoint } from './Viewpoint';
import { Track } from './Track';
import './assets/kungsholmen_2010-04-30.tcx';
import './assets/kungsholmen_2010-05-03.tcx';
import './assets/kungsholmen_2010-06-20.tcx';
import './assets/kungsholmen_2010-06-23.tcx';
import './assets/kungsholmen_2010-12-12.tcx';
import './assets/kungsholmen_2011-01-07.tcx';
import './style.css';


window.addEventListener('load', () => initiera());

document.getElementById('route1').addEventListener('click', () => loadTrack('assets/kungsholmen_2010-04-30.tcx'));
document.getElementById('route2').addEventListener('click', () => loadTrack('assets/kungsholmen_2010-05-03.tcx'));
document.getElementById('route3').addEventListener('click', () => loadTrack('assets/kungsholmen_2010-06-20.tcx'));
document.getElementById('route4').addEventListener('click', () => loadTrack('assets/kungsholmen_2010-06-23.tcx'));
document.getElementById('route5').addEventListener('click', () => loadTrack('assets/kungsholmen_2010-12-12.tcx'));
document.getElementById('route6').addEventListener('click', () => loadTrack('assets/kungsholmen_2011-01-07.tcx'));
document.getElementById('loadMany').addEventListener('click', () => loadManyRoutes());
document.getElementById('draw').addEventListener('click', () => draw(100, 50, 1300, 800, addedTracks));
document.getElementById('draw3d').addEventListener('click', () => draw3d(100, 50, 1300, 800, addedTracks));

document.getElementById('increaseElevation').addEventListener('click', () => increaseElevation());
document.getElementById('decreaseElevation').addEventListener('click', () => decreaseElevation());
document.getElementById('anticlockwise').addEventListener('click', () => rotateAnticlockwise());
document.getElementById('clockwise').addEventListener('click', () => rotateClockwise());


//inspiration fr�n http://billmill.org/static/canvastutorial/

//global array d�r laddade rundor l�ggs
const addedTracks: Track[] = [];
const viewpoint: Viewpoint = new Viewpoint();

let WIDTH: number;
let HEIGHT: number;
const canvasMinX: number = 0;
const canvasMaxX: number = 0;


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

function initiera(): void {
    const canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
    HEIGHT = canvas.offsetHeight;
    WIDTH = canvas.offsetWidth;
}


function increaseElevation(): void {
    viewpoint.changeElevation(5);
    draw3d(100, 50, 1300, 800, addedTracks);
}

function decreaseElevation(): void {
    viewpoint.changeElevation(-5);
    draw3d(100, 50, 1300, 800, addedTracks);
}

function rotateClockwise(): void {
    viewpoint.changeAzimuth(-5);
    draw3d(100, 50, 1300, 800, addedTracks);
}

function rotateAnticlockwise(): void {
    viewpoint.changeAzimuth(+5);
    draw3d(100, 50, 1300, 800, addedTracks);
}



function draw3d(
    offset_x: number,
    offset_y: number,
    graf_bredd: number,
    graf_hojd: number,
    tracks: Track[]): void {

    if (tracks.length == 0) {
        return;
    }



    const canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
    if (canvas.getContext) {
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d');
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.save();
        ctx.translate(offset_x, offset_y);

        //hittar max&min p� lat, long och h�jd i f�rsta rundan
        let extr_vekt: number[] = hitta_maxmin(tracks[0].track, 4);
        let mest_lat: number = extr_vekt[0];
        let minst_lat: number = extr_vekt[1];
        extr_vekt = hitta_maxmin(tracks[0].track, 5);
        let mest_long: number = extr_vekt[0];
        let minst_long: number = extr_vekt[1];
        extr_vekt = hitta_maxmin(tracks[0].track, 6);
        let mest_hojd: number = extr_vekt[0];
        let minst_hojd: number = extr_vekt[1];
        //kollar i de andra rundorna om det finns extremare v�rden f�r lat,long & h�jd
        for (let runda_extr: number = 1; runda_extr < tracks.length; runda_extr++) {
            //kollar om latituden �r h�gst eller minst i aktuell runda
            let extr_vekt: number[] = hitta_maxmin(tracks[runda_extr].track, 4);
            if (extr_vekt[0] > mest_lat) { mest_lat = extr_vekt[0]; }
            if (extr_vekt[1] < minst_lat) { minst_lat = extr_vekt[1]; }
            //kollar om longituden �r h�gst eller minst i aktuell runda
            extr_vekt = hitta_maxmin(tracks[runda_extr].track, 5);
            if (extr_vekt[0] > mest_long) { mest_long = extr_vekt[0]; }
            if (extr_vekt[1] < minst_long) { minst_long = extr_vekt[1]; }
            //kollar om h�jden �r h�gst eller minst i aktuell runda
            extr_vekt = hitta_maxmin(tracks[runda_extr].track, 6);
            if (extr_vekt[0] > mest_hojd) { mest_hojd = extr_vekt[0]; }
            if (extr_vekt[1] < minst_hojd) { minst_hojd = extr_vekt[1]; }
        }
        //tar fram diff mellan h�gst och l�gst f�r lat,long&h�jd
        const diff_lat: number = mest_lat - minst_lat;
        const diff_long: number = mest_long - minst_long;
        const hojd_diff: number = mest_hojd - minst_hojd;
        const hojd_faktor: number = 40 / hojd_diff;

        //bredd&h�jd p� omr�det som utg�rs av rundorna utr�knad som funktion av max&min f�r lat-long
        const koord_hojd: number =
            haversine(mest_lat, minst_long + diff_long / 2, minst_lat, minst_long + diff_long / 2);
        const koord_bredd: number =
            haversine(minst_lat + diff_lat / 2, minst_long, minst_lat + diff_lat / 2, mest_long);
        let latfaktor: number;
        let longfaktor: number;
        //faktor f�r att s�tta r�tt f�rh�llande p� rundan/rundorna som visas
        if (koord_hojd < koord_bredd) {
            latfaktor = graf_hojd / diff_lat * koord_hojd / koord_bredd;
            longfaktor = graf_bredd / diff_long * koord_bredd / koord_bredd;
        }
        else {
            latfaktor = graf_hojd / diff_lat * koord_hojd / koord_hojd;
            longfaktor = graf_bredd / diff_long * koord_bredd / koord_hojd;
        }
        //alert(mest_lat+"\n"+minst_lat+"\n"+diff_lat);
        //ritar alla laddade rundor i matrisen
        for (let runda: number = 0; runda < tracks.length; runda++) {
            let xkoord = [];
            let ykoord = [];

            //l�ser in koordinaterna i WGS84? till pixlar i det angivna f�nstret f�r rundan
            for (let p: number = 0; p < tracks[runda].track.length; p++) {
                xkoord.push((tracks[runda].track[p][5] - minst_long - diff_long / 2) * longfaktor);
                ykoord.push((tracks[runda].track[p][4] - minst_lat - diff_lat / 2) * latfaktor);
                //alert(graf_hojd+(matrisen[runda][p][4]-minst_lat-diff_lat/2)*latfaktor);
            }

            //fyller en array som f�r varje punkt i xkoord+ykoord inneh�ll en enhetsnormerad vektor som �r "vinkelr�t" mot den punkten p� banan
            let vinkelratv: number[][] = [];
            vinkelratv = ratvinkvekt(xkoord, ykoord);

            // ritar in rundan
            ctx.strokeStyle = 'rgba(96, 135, 85, 0.5)';
            ctx.lineWidth = 1;
            ctx.lineCap = 'butt';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            let roteradPunkt = viewpoint.roteraKoords(xkoord[0], ykoord[0], 0);
            //ctx.moveTo(graf_bredd/2+xkoord[0]*rot_a+ykoord[0]*rot_b,graf_hojd/2+xkoord[0]*rot_c+ykoord[0]*rot_d);
            ctx.moveTo(graf_bredd / 2 + roteradPunkt[0], graf_hojd / 2 + roteradPunkt[1]);
            for (let i: number = 1; i < tracks[runda].track.length; i++) {
                //ctx.lineTo(graf_bredd/2+xkoord[i]*rot_a+ykoord[i]*rot_b,graf_hojd/2+xkoord[i]*rot_c+ykoord[i]*rot_d);
                roteradPunkt = viewpoint.roteraKoords(xkoord[i], ykoord[i], 0);
                ctx.lineTo(graf_bredd / 2 + roteradPunkt[0], graf_hojd / 2 + roteradPunkt[1]);
            }
            ctx.stroke();


            //ritar de ortogonala strecken
            if (minst_hojd < 0) { minst_hojd = 0; }
            for (let g: number = 0; g < tracks[runda].track.length; g++) {
                //if(vinkelratv[g][0]!=="x"){
                ctx.beginPath();
                roteradPunkt = viewpoint.roteraKoords(xkoord[g], ykoord[g], 0);
                //ctx.moveTo(graf_bredd/2+xkoord[g]*rot_a+ykoord[g]*rot_b,graf_hojd/2+xkoord[g]*rot_c+ykoord[g]*rot_d);
                ctx.moveTo(graf_bredd / 2 + roteradPunkt[0], graf_hojd / 2 + roteradPunkt[1]);
                //ctx.lineTo(graf_bredd/2+xkoord[g]*rot_a+ykoord[g]*rot_b,graf_hojd/2+xkoord[g]*rot_c+ykoord[g]*rot_d+(matrisen[runda][g][6]-minst_hojd)/hojd_faktor*rot_e);
                roteradPunkt = viewpoint.roteraKoords(xkoord[g], ykoord[g], (tracks[runda].track[g][6] - minst_hojd) / hojd_faktor);
                ctx.lineTo(graf_bredd / 2 + roteradPunkt[0], graf_hojd / 2 + roteradPunkt[1]);
                ctx.stroke();
                //}
                //alert(graf_hojd/2+xkoord[g]*rot_c+ykoord[g]*rot_d+matrisen[runda][g][6]/hojd_faktor*rot_e);
            }
            //rita start plupp
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.beginPath();
            roteradPunkt = viewpoint.roteraKoords(xkoord[0], ykoord[0], 0);
            ctx.arc(graf_bredd / 2 + roteradPunkt[0], graf_hojd / 2 + roteradPunkt[1], 3, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
            //ritar slut-plupp
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.beginPath();
            roteradPunkt = viewpoint.roteraKoords(xkoord[xkoord.length - 1], ykoord[ykoord.length - 1], 0);
            ctx.arc(graf_bredd / 2 + roteradPunkt[0], graf_hojd / 2 + roteradPunkt[1], 3, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();

        }
        //ritar norr-pil
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        //pilen
        ctx.moveTo(graf_bredd / 2, graf_hojd / 2);
        let roteradPilPunkt = viewpoint.roteraKoords(0, 40, 0);
        ctx.lineTo(graf_bredd / 2 + roteradPilPunkt[0], graf_hojd / 2 + roteradPilPunkt[1]);
        roteradPilPunkt = viewpoint.roteraKoords(-4, 32, 0);
        ctx.moveTo(graf_bredd / 2 + roteradPilPunkt[0], graf_hojd / 2 + roteradPilPunkt[1]);
        roteradPilPunkt = viewpoint.roteraKoords(0, 40, 0);
        ctx.lineTo(graf_bredd / 2 + roteradPilPunkt[0], graf_hojd / 2 + roteradPilPunkt[1]);
        roteradPilPunkt = viewpoint.roteraKoords(4, 32, 0);
        ctx.lineTo(graf_bredd / 2 + roteradPilPunkt[0], graf_hojd / 2 + roteradPilPunkt[1]);
        //tecknet "N"
        roteradPilPunkt = viewpoint.roteraKoords(3, 0, 0);
        ctx.moveTo(graf_bredd / 2 + roteradPilPunkt[0], graf_hojd / 2 + roteradPilPunkt[1]);
        roteradPilPunkt = viewpoint.roteraKoords(3, 6, 0);
        ctx.lineTo(graf_bredd / 2 + roteradPilPunkt[0], graf_hojd / 2 + roteradPilPunkt[1]);
        roteradPilPunkt = viewpoint.roteraKoords(6, 0, 0);
        ctx.lineTo(graf_bredd / 2 + roteradPilPunkt[0], graf_hojd / 2 + roteradPilPunkt[1]);
        roteradPilPunkt = viewpoint.roteraKoords(6, 6, 0);
        ctx.lineTo(graf_bredd / 2 + roteradPilPunkt[0], graf_hojd / 2 + roteradPilPunkt[1]);
        ctx.stroke();

        ctx.restore();
    }


}



function draw(
    offset_x: number,
    offset_y: number,
    graf_bredd: number,
    graf_hojd: number,
    tracks: Track[]): void {

    if (tracks.length == 0) {
        return;
    }

    const canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
    if (canvas.getContext) {
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d');
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.save();
        ctx.translate(offset_x, offset_y);
        //ctx.clearRect(0,0,graf_bredd,graf_hojd);
        //hittar max&min p� lat, long och h�jd i f�rsta rundan
        let extr_vekt: number[] = hitta_maxmin(tracks[0].track, 4);
        let mest_lat: number = extr_vekt[0];
        let minst_lat: number = extr_vekt[1];
        extr_vekt = hitta_maxmin(tracks[0].track, 5);
        let mest_long: number = extr_vekt[0];
        let minst_long: number = extr_vekt[1];
        extr_vekt = hitta_maxmin(tracks[0].track, 6);
        let mest_hojd: number = extr_vekt[0];
        let minst_hojd: number = extr_vekt[1];
        //kollar i de andra rundorna om det finns extremare v�rden f�r lat,long & h�jd
        for (let runda_extr: number = 1; runda_extr < tracks.length; runda_extr++) {
            //kollar om latituden �r h�gst eller minst i aktuell runda
            extr_vekt = hitta_maxmin(tracks[runda_extr].track, 4);
            if (extr_vekt[0] > mest_lat) { mest_lat = extr_vekt[0]; }
            if (extr_vekt[1] < minst_lat) { minst_lat = extr_vekt[1]; }
            //kollar om longituden �r h�gst eller minst i aktuell runda
            extr_vekt = hitta_maxmin(tracks[runda_extr].track, 5);
            if (extr_vekt[0] > mest_long) { mest_long = extr_vekt[0]; }
            if (extr_vekt[1] < minst_long) { minst_long = extr_vekt[1]; }
            //kollar om h�jden �r h�gst eller minst i aktuell runda
            extr_vekt = hitta_maxmin(tracks[runda_extr].track, 6);
            if (extr_vekt[0] > mest_hojd) { mest_hojd = extr_vekt[0]; }
            if (extr_vekt[1] < minst_hojd) { minst_hojd = extr_vekt[1]; }
        }
        //tar fram diff mellan h�gst och l�gst f�r lat,long&h�jd
        const diff_lat: number = mest_lat - minst_lat;
        const diff_long: number = mest_long - minst_long;
        const hojd_diff: number = mest_hojd - minst_hojd;

        //bredd&h�jd p� omr�det som utg�rs av rundorna utr�knad som funktion av max&min f�r lat-long
        const koord_hojd: number =
            haversine(mest_lat, minst_long + diff_long / 2, minst_lat, minst_long + diff_long / 2);
        const koord_bredd: number =
            haversine(minst_lat + diff_lat / 2, minst_long, minst_lat + diff_lat / 2, mest_long);
        //faktor f�r att s�tta r�tt f�rh�llande p� rundan/rundorna som visas
        let latfaktor: number;
        let longfaktor: number;
        if (koord_hojd < koord_bredd) {
            latfaktor = graf_hojd / diff_lat * koord_hojd / koord_bredd;
            longfaktor = graf_bredd / diff_long * koord_bredd / koord_bredd;
        }
        else {
            latfaktor = graf_hojd / diff_lat * koord_hojd / koord_hojd;
            longfaktor = graf_bredd / diff_long * koord_bredd / koord_hojd;
        }

        //ritar alla laddade rundor i matrisen
        for (let runda: number = 0; runda < tracks.length; runda++) {
            const xkoord: number[] = [];
            const ykoord: number[] = [];

            //l�ser in koordinaterna i WGS84? till pixlar i det angivna f�nstret f�r rundan
            for (let p: number = 0; p < tracks[runda].track.length; p++) {
                xkoord.push((tracks[runda].track[p][5] - minst_long) * longfaktor);
                ykoord.push(graf_hojd - (tracks[runda].track[p][4] - minst_lat) * latfaktor);
            }

            //fyller en array som f�r varje punkt i xkoord+ykoord inneh�ll en enhetsnormerad vektor som �r "vinkelr�t" mot den punkten p� banan
            let vinkelratv: number[][] = [];
            vinkelratv = ratvinkvekt(xkoord, ykoord);

            // ritar in rundan
            ctx.strokeStyle = 'rgba(96, 135, 85, 0.5)';
            ctx.lineWidth = 1;
            ctx.lineCap = 'butt';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(xkoord[0], ykoord[0]);
            for (let i: number = 1; i < tracks[runda].track.length; i++) {
                ctx.lineTo(xkoord[i], ykoord[i]);
            }
            ctx.stroke();


            //ritar de ortogonala strecken
            if (minst_hojd < 0) { minst_hojd = 0; }
            for (let g: number = 1; g < vinkelratv.length - 1; g++) {
                if (vinkelratv[g][0] !== null) {
                    ctx.beginPath();
                    ctx.moveTo(xkoord[g], ykoord[g]);
                    const hojdipunkt: number = tracks[runda].track[g][6] - minst_hojd;
                    ctx.lineTo(
                        xkoord[g] + vinkelratv[g][0] * hojdipunkt / hojd_diff * 40,
                        ykoord[g] + vinkelratv[g][1] * hojdipunkt / hojd_diff * 40
                    );
                    ctx.stroke();
                }
            }

        }

        ctx.restore();
    }


}




function ratvinkvekt(xkoordinvekt: number[], ykoordinvekt: number[]): number[][] {
    //r�knar ut vektor som �r vinkelr�t mot aktuell punkt l�ngs rundan 
    const helkoorden: number[][] = [];
    for (let q: number = 0; q < xkoordinvekt.length; q++) {
        const hogervarv: number = -1;
        const koorden: number[] = [];
        //r�knar ut vektorer mellan n�sta och f�reg�ende punkt
        const xdiff2: number = xkoordinvekt[2 + q] - xkoordinvekt[1 + q];
        const ydiff2: number = ykoordinvekt[2 + q] - ykoordinvekt[1 + q];
        const xdiff1: number = xkoordinvekt[0 + q] - xkoordinvekt[1 + q];
        const ydiff1: number = ykoordinvekt[0 + q] - ykoordinvekt[1 + q];

        if (xdiff2 !== 0 && !isNaN(xdiff2)) {
            if (xdiff1 !== 0 && !isNaN(xdiff1)) {
                //ingen av diffarna �r noll
                const kvoten1: number = Math.sqrt(Math.pow(xdiff1, 2) + Math.pow(ydiff1, 2));
                const kvoten2: number = Math.sqrt(Math.pow(xdiff2, 2) + Math.pow(ydiff2, 2));
                const xrikt1: number = -ydiff1 / kvoten1;
                const yrikt1: number = xdiff1 / kvoten1;
                const xrikt2: number = ydiff2 / kvoten2;
                const yrikt2: number = -xdiff2 / kvoten2;
                const totkvot: number = Math.sqrt(Math.pow((xrikt1 + xrikt2), 2) + Math.pow((yrikt1 + yrikt2), 2));

                koorden.push(hogervarv * (xrikt1 + xrikt2) / totkvot);
                koorden.push(hogervarv * (yrikt1 + yrikt2) / totkvot);

            }
            else {
                //diff2 �r inte noll
                const kvoten2: number = Math.sqrt(Math.pow(xdiff2, 2) + Math.pow(ydiff2, 2));
                const xrikt2: number = ydiff2 / kvoten2;
                const yrikt2: number = -xdiff2 / kvoten2;
                koorden.push(hogervarv * xrikt2);
                koorden.push(hogervarv * yrikt2);

            }

        }
        else {
            if (xdiff1 !== 0 && !isNaN(xdiff1)) {
                //diff1 �r inte noll
                const kvoten1: number = Math.sqrt(Math.pow(xdiff1, 2) + Math.pow(ydiff1, 2));
                const xrikt1: number = -ydiff1 / kvoten1;
                const yrikt1: number = xdiff1 / kvoten1;
                koorden.push(hogervarv * xrikt1);
                koorden.push(hogervarv * yrikt1);

            }
            else {
                //b�da diffarna �r noll
                koorden.push(null);
                koorden.push(null);

            }
        }
        helkoorden.push(koorden);
    }
    return helkoorden;
}




/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Latitude/longitude spherical geodesy formulae & scripts (c) Chris Veness 2002-2009            */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    //http://en.wikipedia.org/wiki/Haversine_formula
    //kod fr�n: http://www.movable-type.co.uk/scripts/latlong.html

    const R: number = 6371; // km
    const dLat: number = convertFromDegreesToRadians(lat2 - lat1);
    const dLon: number = convertFromDegreesToRadians(lon2 - lon1);

    const a: number =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(convertFromDegreesToRadians(lat1)) *
        Math.cos(convertFromDegreesToRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c: number = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d: number = R * c;

    return d;
}

function convertFromDegreesToRadians(degree: number): number {
    return degree * Math.PI / 180;
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









//kollar igenom en array av arrays i kolumn "kol_nr" efter st�rsta och minsta v�rde
function hitta_maxmin(vektor: number[][], kol_nr: number): number[] {
    let storsta_val: number = vektor[0][kol_nr];
    let minsta_val: number = vektor[0][kol_nr];
    for (let k: number = 0; k < vektor.length; k++) {
        const aktuell_cell: number = vektor[k][kol_nr];
        if (aktuell_cell > storsta_val) { storsta_val = aktuell_cell; }
        if (aktuell_cell < minsta_val) { minsta_val = aktuell_cell; }
    }
    const temp_vektor: number[] = [];
    temp_vektor[0] = storsta_val;
    temp_vektor[1] = minsta_val;
    return temp_vektor;
}

function loadManyRoutes(): void {
    loadTrack('assets/kungsholmen_2010-04-30.tcx');
    loadTrack('assets/kungsholmen_2010-05-03.tcx');
    loadTrack('assets/kungsholmen_2010-06-20.tcx');
    loadTrack('assets/kungsholmen_2010-06-23.tcx');
    loadTrack('assets/kungsholmen_2010-12-12.tcx');
    loadTrack('assets/kungsholmen_2011-01-07.tcx');
}

