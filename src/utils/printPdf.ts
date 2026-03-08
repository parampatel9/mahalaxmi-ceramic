export async function printPdfFromUrl(url: string) {
  const token = localStorage.getItem('jwtToken');
  const response = await fetch(url, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch PDF (${response.status})`);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
  const printWindow = window.open(blobUrl, '_blank');

  if (!printWindow) {
    URL.revokeObjectURL(blobUrl);
    throw new Error('Popup blocked');
  }

  const runPrint = () => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch {
      // Ignore print errors and keep fallback behavior in callers.
    }
  };

  printWindow.addEventListener(
    'load',
    () => {
      setTimeout(runPrint, 300);
    },
    { once: true }
  );

  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
