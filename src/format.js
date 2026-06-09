// Shared display formatters.

// Format a number as Philippine Pesos, e.g. 9300 -> "₱9,300.00".
// The ₱ sign is the Philippine peso symbol, so prices read unambiguously
// as PHP everywhere this is used.
export function formatPeso(value) {
	const amount = Number(value);
	if (!Number.isFinite(amount)) return '₱0.00';
	return '₱' + amount.toLocaleString('en-PH', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}
