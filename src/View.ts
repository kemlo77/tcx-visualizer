import { Track } from './Track';
import { Viewpoint } from './Viewpoint';

export class View {


    private _canvasElement: HTMLCanvasElement;
    private _canvasCtx: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    private viewpoint: Viewpoint;

    constructor() {
        this._canvasElement = document.getElementById('canvas') as HTMLCanvasElement;
        this._canvasCtx = this._canvasElement.getContext('2d');
        this.width = this._canvasElement.offsetWidth;
        this.height = this._canvasElement.offsetHeight;
        this.viewpoint = new Viewpoint();
    }


    increaseElevation(): void {
        this.viewpoint.changeElevation(5);
    }

    decreaseElevation(): void {
        this.viewpoint.changeElevation(-5);
    }

    rotateClockwise(): void {
        this.viewpoint.changeAzimuth(-5);
    }

    rotateAnticlockwise(): void {
        this.viewpoint.changeAzimuth(+5);
    }



    draw3d(
        offset_x: number,
        offset_y: number,
        graf_bredd: number,
        graf_hojd: number,
        tracks: Track[]): void {

        if (tracks.length == 0) {
            return;
        }





        this._canvasCtx.clearRect(0, 0, this.width, this.height);
        this._canvasCtx.save();
        this._canvasCtx.translate(offset_x, offset_y);

        //hittar max&min p� lat, long och h�jd i f�rsta rundan
        let extr_vekt: number[] = this.hitta_maxmin(tracks[0].track, 4);
        let mest_lat: number = extr_vekt[0];
        let minst_lat: number = extr_vekt[1];
        extr_vekt = this.hitta_maxmin(tracks[0].track, 5);
        let mest_long: number = extr_vekt[0];
        let minst_long: number = extr_vekt[1];
        extr_vekt = this.hitta_maxmin(tracks[0].track, 6);
        let mest_hojd: number = extr_vekt[0];
        let minst_hojd: number = extr_vekt[1];
        //kollar i de andra rundorna om det finns extremare v�rden f�r lat,long & h�jd
        for (let runda_extr: number = 1; runda_extr < tracks.length; runda_extr++) {
            //kollar om latituden �r h�gst eller minst i aktuell runda
            let extr_vekt: number[] = this.hitta_maxmin(tracks[runda_extr].track, 4);
            if (extr_vekt[0] > mest_lat) { mest_lat = extr_vekt[0]; }
            if (extr_vekt[1] < minst_lat) { minst_lat = extr_vekt[1]; }
            //kollar om longituden �r h�gst eller minst i aktuell runda
            extr_vekt = this.hitta_maxmin(tracks[runda_extr].track, 5);
            if (extr_vekt[0] > mest_long) { mest_long = extr_vekt[0]; }
            if (extr_vekt[1] < minst_long) { minst_long = extr_vekt[1]; }
            //kollar om h�jden �r h�gst eller minst i aktuell runda
            extr_vekt = this.hitta_maxmin(tracks[runda_extr].track, 6);
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
            this.haversine(mest_lat, minst_long + diff_long / 2, minst_lat, minst_long + diff_long / 2);
        const koord_bredd: number =
            this.haversine(minst_lat + diff_lat / 2, minst_long, minst_lat + diff_lat / 2, mest_long);
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

            //fyller en array som f�r varje punkt i xkoord+ykoord inneh�ll en 
            // enhetsnormerad vektor som �r "vinkelr�t" mot den punkten p� banan
            let vinkelratv: number[][] = [];
            vinkelratv = this.ratvinkvekt(xkoord, ykoord);

            // ritar in rundan
            this._canvasCtx.strokeStyle = 'rgba(96, 135, 85, 0.5)';
            this._canvasCtx.lineWidth = 1;
            this._canvasCtx.lineCap = 'butt';
            this._canvasCtx.lineJoin = 'round';
            this._canvasCtx.beginPath();
            let roteradPunkt: number[] = this.viewpoint.roteraKoords(xkoord[0], ykoord[0], 0);
            this._canvasCtx.moveTo(graf_bredd / 2 + roteradPunkt[0], graf_hojd / 2 + roteradPunkt[1]);
            for (let i: number = 1; i < tracks[runda].track.length; i++) {
                roteradPunkt = this.viewpoint.roteraKoords(xkoord[i], ykoord[i], 0);
                this._canvasCtx.lineTo(graf_bredd / 2 + roteradPunkt[0], graf_hojd / 2 + roteradPunkt[1]);
            }
            this._canvasCtx.stroke();


            //ritar de ortogonala strecken
            if (minst_hojd < 0) { minst_hojd = 0; }
            for (let g: number = 0; g < tracks[runda].track.length; g++) {
                this._canvasCtx.beginPath();
                roteradPunkt = this.viewpoint.roteraKoords(xkoord[g], ykoord[g], 0);
                this._canvasCtx.moveTo(graf_bredd / 2 + roteradPunkt[0], graf_hojd / 2 + roteradPunkt[1]);
                roteradPunkt = this.viewpoint
                    .roteraKoords(xkoord[g], ykoord[g], (tracks[runda].track[g][6] - minst_hojd) / hojd_faktor);
                this._canvasCtx.lineTo(graf_bredd / 2 + roteradPunkt[0], graf_hojd / 2 + roteradPunkt[1]);
                this._canvasCtx.stroke();
            }
            //rita start plupp
            this._canvasCtx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            this._canvasCtx.beginPath();
            roteradPunkt = this.viewpoint.roteraKoords(xkoord[0], ykoord[0], 0);
            this._canvasCtx.arc(graf_bredd / 2 + roteradPunkt[0], graf_hojd / 2 + roteradPunkt[1], 3, 0, Math.PI * 2, true);
            this._canvasCtx.closePath();
            this._canvasCtx.fill();
            //ritar slut-plupp
            this._canvasCtx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            this._canvasCtx.beginPath();
            roteradPunkt = this.viewpoint.roteraKoords(xkoord[xkoord.length - 1], ykoord[ykoord.length - 1], 0);
            this._canvasCtx.arc(graf_bredd / 2 + roteradPunkt[0], graf_hojd / 2 + roteradPunkt[1], 3, 0, Math.PI * 2, true);
            this._canvasCtx.closePath();
            this._canvasCtx.fill();

        }
        //ritar norr-pil
        this._canvasCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        this._canvasCtx.beginPath();
        //pilen
        this._canvasCtx.moveTo(graf_bredd / 2, graf_hojd / 2);
        let roteradPilPunkt: number[] = this.viewpoint.roteraKoords(0, 40, 0);
        this._canvasCtx.lineTo(graf_bredd / 2 + roteradPilPunkt[0], graf_hojd / 2 + roteradPilPunkt[1]);
        roteradPilPunkt = this.viewpoint.roteraKoords(-4, 32, 0);
        this._canvasCtx.moveTo(graf_bredd / 2 + roteradPilPunkt[0], graf_hojd / 2 + roteradPilPunkt[1]);
        roteradPilPunkt = this.viewpoint.roteraKoords(0, 40, 0);
        this._canvasCtx.lineTo(graf_bredd / 2 + roteradPilPunkt[0], graf_hojd / 2 + roteradPilPunkt[1]);
        roteradPilPunkt = this.viewpoint.roteraKoords(4, 32, 0);
        this._canvasCtx.lineTo(graf_bredd / 2 + roteradPilPunkt[0], graf_hojd / 2 + roteradPilPunkt[1]);
        //tecknet "N"
        roteradPilPunkt = this.viewpoint.roteraKoords(3, 0, 0);
        this._canvasCtx.moveTo(graf_bredd / 2 + roteradPilPunkt[0], graf_hojd / 2 + roteradPilPunkt[1]);
        roteradPilPunkt = this.viewpoint.roteraKoords(3, 6, 0);
        this._canvasCtx.lineTo(graf_bredd / 2 + roteradPilPunkt[0], graf_hojd / 2 + roteradPilPunkt[1]);
        roteradPilPunkt = this.viewpoint.roteraKoords(6, 0, 0);
        this._canvasCtx.lineTo(graf_bredd / 2 + roteradPilPunkt[0], graf_hojd / 2 + roteradPilPunkt[1]);
        roteradPilPunkt = this.viewpoint.roteraKoords(6, 6, 0);
        this._canvasCtx.lineTo(graf_bredd / 2 + roteradPilPunkt[0], graf_hojd / 2 + roteradPilPunkt[1]);
        this._canvasCtx.stroke();

        this._canvasCtx.restore();



    }



    draw(
        offset_x: number,
        offset_y: number,
        graf_bredd: number,
        graf_hojd: number,
        tracks: Track[]): void {

        if (tracks.length == 0) {
            return;
        }



        this._canvasCtx.clearRect(0, 0, this.width, this.height);
        this._canvasCtx.save();
        this._canvasCtx.translate(offset_x, offset_y);
        //hittar max&min p� lat, long och h�jd i f�rsta rundan
        let extr_vekt: number[] = this.hitta_maxmin(tracks[0].track, 4);
        let mest_lat: number = extr_vekt[0];
        let minst_lat: number = extr_vekt[1];
        extr_vekt = this.hitta_maxmin(tracks[0].track, 5);
        let mest_long: number = extr_vekt[0];
        let minst_long: number = extr_vekt[1];
        extr_vekt = this.hitta_maxmin(tracks[0].track, 6);
        let mest_hojd: number = extr_vekt[0];
        let minst_hojd: number = extr_vekt[1];
        //kollar i de andra rundorna om det finns extremare v�rden f�r lat,long & h�jd
        for (let runda_extr: number = 1; runda_extr < tracks.length; runda_extr++) {
            //kollar om latituden �r h�gst eller minst i aktuell runda
            extr_vekt = this.hitta_maxmin(tracks[runda_extr].track, 4);
            if (extr_vekt[0] > mest_lat) { mest_lat = extr_vekt[0]; }
            if (extr_vekt[1] < minst_lat) { minst_lat = extr_vekt[1]; }
            //kollar om longituden �r h�gst eller minst i aktuell runda
            extr_vekt = this.hitta_maxmin(tracks[runda_extr].track, 5);
            if (extr_vekt[0] > mest_long) { mest_long = extr_vekt[0]; }
            if (extr_vekt[1] < minst_long) { minst_long = extr_vekt[1]; }
            //kollar om h�jden �r h�gst eller minst i aktuell runda
            extr_vekt = this.hitta_maxmin(tracks[runda_extr].track, 6);
            if (extr_vekt[0] > mest_hojd) { mest_hojd = extr_vekt[0]; }
            if (extr_vekt[1] < minst_hojd) { minst_hojd = extr_vekt[1]; }
        }
        //tar fram diff mellan h�gst och l�gst f�r lat,long&h�jd
        const diff_lat: number = mest_lat - minst_lat;
        const diff_long: number = mest_long - minst_long;
        const hojd_diff: number = mest_hojd - minst_hojd;

        //bredd&h�jd p� omr�det som utg�rs av rundorna utr�knad som funktion av max&min f�r lat-long
        const koord_hojd: number =
            this.haversine(mest_lat, minst_long + diff_long / 2, minst_lat, minst_long + diff_long / 2);
        const koord_bredd: number =
            this.haversine(minst_lat + diff_lat / 2, minst_long, minst_lat + diff_lat / 2, mest_long);
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

            //fyller en array som f�r varje punkt i xkoord+ykoord inneh�ll en 
            //enhetsnormerad vektor som �r "vinkelr�t" mot den punkten p� banan
            let vinkelratv: number[][] = [];
            vinkelratv = this.ratvinkvekt(xkoord, ykoord);

            // ritar in rundan
            this._canvasCtx.strokeStyle = 'rgba(96, 135, 85, 0.5)';
            this._canvasCtx.lineWidth = 1;
            this._canvasCtx.lineCap = 'butt';
            this._canvasCtx.lineJoin = 'round';
            this._canvasCtx.beginPath();
            this._canvasCtx.moveTo(xkoord[0], ykoord[0]);
            for (let i: number = 1; i < tracks[runda].track.length; i++) {
                this._canvasCtx.lineTo(xkoord[i], ykoord[i]);
            }
            this._canvasCtx.stroke();


            //ritar de ortogonala strecken
            if (minst_hojd < 0) { minst_hojd = 0; }
            for (let g: number = 1; g < vinkelratv.length - 1; g++) {
                if (vinkelratv[g][0] !== null) {
                    this._canvasCtx.beginPath();
                    this._canvasCtx.moveTo(xkoord[g], ykoord[g]);
                    const hojdipunkt: number = tracks[runda].track[g][6] - minst_hojd;
                    this._canvasCtx.lineTo(
                        xkoord[g] + vinkelratv[g][0] * hojdipunkt / hojd_diff * 40,
                        ykoord[g] + vinkelratv[g][1] * hojdipunkt / hojd_diff * 40
                    );
                    this._canvasCtx.stroke();
                }
            }

        }

        this._canvasCtx.restore();



    }


    //kollar igenom en array av arrays i kolumn "kol_nr" efter st�rsta och minsta v�rde
    private hitta_maxmin(vektor: number[][], kol_nr: number): number[] {
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



    private ratvinkvekt(xkoordinvekt: number[], ykoordinvekt: number[]): number[][] {
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
    private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
        //http://en.wikipedia.org/wiki/Haversine_formula
        //kod fr�n: http://www.movable-type.co.uk/scripts/latlong.html

        const R: number = 6371; // km
        const dLat: number = this.convertFromDegreesToRadians(lat2 - lat1);
        const dLon: number = this.convertFromDegreesToRadians(lon2 - lon1);

        const a: number =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.convertFromDegreesToRadians(lat1)) *
            Math.cos(this.convertFromDegreesToRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c: number = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d: number = R * c;

        return d;
    }

    private convertFromDegreesToRadians(degree: number): number {
        return degree * Math.PI / 180;
    }

}