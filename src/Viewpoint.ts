export class Viewpoint {

    private elevation: number;
    private azimuth: number = 0;
    private rot_a: number;
    private rot_b: number;
    private rot_c: number;
    private rot_d: number;
    private rot_e: number;

    constructor() {
        this.elevation = Math.PI / 4; //initially 45 degrees
        this.azimuth = 0;
        this.recalculateMatrixValues();
    }

    private recalculateMatrixValues(): void {
        this.rot_a = +Math.cos(this.azimuth);
        this.rot_b = -Math.sin(this.azimuth);
        this.rot_c = -Math.cos(Math.PI / 2 - this.elevation) * Math.sin(this.azimuth);
        this.rot_d = -Math.cos(Math.PI / 2 - this.elevation) * Math.cos(this.azimuth);
        this.rot_e = -Math.sin(Math.PI / 2 - this.elevation);
    }

    changeElevation(degree: number): void {
        const changeInRadians: number = degree / 180 * Math.PI;
        this.elevation += changeInRadians;
        if (this.elevation < 0) {
            this.elevation = 0;
        }
        if (this.elevation > Math.PI / 2) {
            this.elevation = Math.PI / 2;
        }
        this.recalculateMatrixValues();
    }

    changeAzimuth(degree: number): void {
        this.azimuth += degree / 180 * Math.PI;
        this.recalculateMatrixValues();
    }

    roteraKoords(x1: number, y1: number, z1: number): number[] {
        const x2: number = x1 * this.rot_a + y1 * this.rot_b;
        const y2: number = x1 * this.rot_c + y1 * this.rot_d + z1 * this.rot_e;
        return [x2, y2];
    }

}