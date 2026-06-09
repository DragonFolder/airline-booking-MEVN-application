const seatMap = document.getElementById('seatMap');
const totalPriceDisplay = document.getElementById('totalPrice');
const rows = 12;
const seatsPerRow = 6;
const seatPrice = 350;

let selectedSeatsCount = 0;

// Generate Seats
for (let i = 1; i <= rows; i++) {
    // Row Number Label
    const rowLabel = document.createElement('div');
    rowLabel.className = 'label';
    rowLabel.innerText = i;
    
    // Create seats for this row
    for (let j = 0; j < seatsPerRow; j++) {
        // Add a spacer column after the 3rd seat (index 2)
        if (j === 3) {
            const spacer = document.createElement('div');
            seatMap.appendChild(spacer); 
        }

        // Add the row label before the first seat of each row
        if (j === 0) seatMap.appendChild(rowLabel);

        const seat = document.createElement('div');
        seat.className = 'seat';
        
        // Randomly make some seats "occupied" for realism
        if (Math.random() < 0.2) {
            seat.classList.add('occupied');
        }

        seat.addEventListener('click', () => {
            if (!seat.classList.contains('occupied')) {
                seat.classList.toggle('selected');
                updateTotal();
            }
        });

        seatMap.appendChild(seat);
    }
}

function updateTotal() {
    const selected = document.querySelectorAll('.seat.selected').length;
    totalPriceDisplay.innerText = selected * seatPrice;
}