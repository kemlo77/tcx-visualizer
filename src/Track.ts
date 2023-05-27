export class Track {

    private tempxvekt: any[][] = [];

    constructor(tcxDocument: Document) {
        this.writeList(tcxDocument);
    }

    get track(): any[][] {
        return this.tempxvekt;
    }



    //funktion som l�ser igenom xml-filen och sparar in v�rdena i tv� arrayer
    private writeList(xmlDoc: Document): void {
        let lapv = xmlDoc.getElementsByTagName('Lap');
        let tpoint_vektor: any[][] = [];
        //datum_vektor=[];
        //kollar igenom resten av posterna i xml-filen
        let totaltid: number = 0;
        let totalavst: number = 0;
        //loop f�r laps
        for (let i: number = 0; i < lapv.length; i++) {

            const tid = lapv[i].getElementsByTagName('TotalTimeSeconds');
            totaltid = totaltid + parseFloat(tid[0].firstChild.nodeValue);
            let avst = lapv[i].getElementsByTagName('DistanceMeters');
            totalavst = totalavst + parseFloat(avst[0].firstChild.nodeValue);

            let tps = lapv[i].getElementsByTagName('Trackpoint');


            //g�r igenom varje trackpoint i detta lap
            for (let j: number = 0; j < tps.length; j++) {
                let dist_met;
                let heartr_bpm;
                let speed_v;
                let lat_val;
                let long_val;
                let altitude_v;

                //Time
                let time_tag = tps[j].getElementsByTagName('Time');
                let tidpunkt: string = time_tag[0].firstChild.nodeValue;
                const tempdatumiloop: Date = new Date();
                tempdatumiloop.setFullYear(Number(tidpunkt.substring(0, 4)), Number(tidpunkt.substring(5, 7)) - 1, Number(tidpunkt.substring(8, 10)));
                tempdatumiloop.setHours(Number(tidpunkt.substring(11, 13)), Number(tidpunkt.substring(14, 16)), Number(tidpunkt.substring(17, 19)), 0);

                //distanceMeters
                let DistanceMeters_tag = tps[j].getElementsByTagName('DistanceMeters');
                if (DistanceMeters_tag[0]) {
                    dist_met = Math.round(10 * parseFloat(DistanceMeters_tag[0].firstChild.nodeValue)) / 10;
                }
                else {
                    dist_met = null;
                }

                //HeartRateBpm
                let HeartRateBpm_tag = tps[j].getElementsByTagName('HeartRateBpm');
                if (HeartRateBpm_tag[0]) {
                    let value_tag = HeartRateBpm_tag[0].getElementsByTagName('Value');
                    heartr_bpm = parseFloat(value_tag[0].firstChild.nodeValue);
                }
                else {
                    heartr_bpm = null;
                }

                //Speed
                let Extensions_tag = tps[j].getElementsByTagName('Extensions');
                if (Extensions_tag[0]) {
                    let TPX_tag = Extensions_tag[0].getElementsByTagName('TPX');
                    let Speed_tag = TPX_tag[0].getElementsByTagName('Speed');
                    speed_v = parseFloat(Speed_tag[0].firstChild.nodeValue);
                }
                else {
                    speed_v = null;
                }

                //Position
                let Position_tag = tps[j].getElementsByTagName('Position');
                if (Position_tag[0]) {
                    let lat_tag = Position_tag[0].getElementsByTagName('LatitudeDegrees');
                    lat_val = parseFloat(lat_tag[0].firstChild.nodeValue);
                    let long_tag = Position_tag[0].getElementsByTagName('LongitudeDegrees');
                    long_val = parseFloat(long_tag[0].firstChild.nodeValue);
                }
                else {
                    lat_val = null;
                    long_val = null;
                }

                //AltitudeMeters
                let AltitudeMeters_tag = tps[j].getElementsByTagName('AltitudeMeters');
                if (AltitudeMeters_tag[0]) {
                    altitude_v = parseFloat(AltitudeMeters_tag[0].firstChild.nodeValue);
                }
                else {
                    altitude_v = null;
                }

                //sparar v�rden i en vektor
                const temp_vektor = [];
                temp_vektor.push(tempdatumiloop);
                temp_vektor.push(dist_met);
                temp_vektor.push(heartr_bpm);
                temp_vektor.push(speed_v);
                temp_vektor.push(lat_val);
                temp_vektor.push(long_val);
                temp_vektor.push(altitude_v);
                tpoint_vektor.push(temp_vektor);
            }



        }

        totaltid = Math.round(totaltid);
        const tid_min: number = (totaltid - totaltid % 60) / 60;
        const tid_sek: number = totaltid % 60;
        totalavst = Math.round(totalavst);
        alert(tid_min + 'm' + tid_sek + 's' + '\nstr�cka' + totalavst + 'm');


        this.tempxvekt = this.interpolera(tpoint_vektor);

    }


    private interpolera(interpvektor: any[][]): any[][] {
        //fyll i de f�rsta v�rdena genom att s�tta lika med efterf�ljande v�rden
        let antal_celler: number = interpvektor[0].length;
        const temporvekt = [];
        //let tempradvekt = [];
        for (let a: number = 0; a < interpvektor.length; a++) {
            const tempradvekt = [];
            for (let b: number = 0; b < antal_celler; b++) {
                tempradvekt.push(interpvektor[a][b]);
            }
            temporvekt.push(tempradvekt);
        }
        antal_celler = temporvekt[0].length;
        for (let z: number = 0; z < antal_celler; z++) {
            if (temporvekt[0][z] == null) {
                for (let q: number = 1; q < temporvekt.length; q++) {
                    if (temporvekt[q][z] !== null) {
                        temporvekt[0][z] = temporvekt[q][z];
                        break;
                    }
                }
            }
        }


        //fyller i sista v�rdena genom att s�tta lika med f�reg�ende v�rden
        for (let x: number = 0; x < antal_celler; x++) {
            if (temporvekt[temporvekt.length - 1][x] == null) {
                for (let y: number = (temporvekt.length - 2); y > 0; y--) {
                    if (temporvekt[y][x] !== null) {
                        temporvekt[temporvekt.length - 1][x] = temporvekt[y][x];
                        break;

                    }
                }
            }
        }


        //interpolerar f�r alla andra v�rden
        for (let w: number = 1; w < (temporvekt.length - 1); w++) {
            for (let t: number = 0; t < antal_celler; t++) {
                if (temporvekt[w][t] == null) {
                    //letar efter n�sta ifyllda v�rde
                    let komihagc: number = 0;
                    for (let c: number = w + 1; c < temporvekt.length - 1; c++) {
                        if (temporvekt[c][t] !== null) {
                            komihagc = c;
                            break;
                        }
                    }
                    const langd1: number = this.sekunddiffaren(temporvekt[w][0], temporvekt[w - 1][0]);
                    const langd2: number = this.sekunddiffaren(temporvekt[komihagc][0], temporvekt[w][0]);
                    //interpoleringsber�kningen
                    temporvekt[w][t] =
                        temporvekt[w - 1][t] +
                        (temporvekt[komihagc][t] - temporvekt[w - 1][t]) / (langd1 + langd2) * langd1;
                }
            }
        }
        return temporvekt;
    }

    //returnerar skillnaden mellan tv� datum i millisekunder
    private sekunddiffaren(datum1: string, datum2: string): number {
        const skillnaden: number = Date.parse(datum1) - Date.parse(datum2);
        return skillnaden;
    }

}