const levels = [];

module.exports = {
    Level: class {
        constructor(size) {

            // generate size X size array
            this.data = [];
            for (let i = 0; i < size; i++) {
                let row = [];
                for (let j = 0; j < size; j++) {
                    row[j] = 0;
                }
                this.data[i] = row;
            }
        }
    }
}