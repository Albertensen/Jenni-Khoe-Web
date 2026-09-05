<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Contract;
use Barryvdh\DomPDF\Facade\Pdf;

class PdfEngineService
{
    public function generateInvoice(Booking $booking, array $addons = [], float $discount = 0): string
    {
        $addonsTotal = array_sum(array_column($addons, 'price'));
        $grandTotal = $booking->total_amount + $addonsTotal - $discount;
        $dp = round($grandTotal * 50 / 100);

        $data = [
            'booking' => $booking,
            'client' => $booking->client,
            'addons' => $addons,
            'addons_total' => $addonsTotal,
            'discount' => $discount,
            'grand_total' => $grandTotal,
            'dp' => $dp,
            'invoice_number' => 'INV-' . $booking->id . '-' . now()->format('Ymd'),
            'date' => now()->format('d F Y'),
        ];

        $pdf = Pdf::loadView('pdfs.invoice', $data);
        $pdf->setPaper('A4');
        $pdf->setOptions([
            'defaultFont' => 'sans-serif',
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => false,
        ]);

        $path = storage_path("app/public/invoices/invoice-{$booking->id}.pdf");
        if (!is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        $pdf->save($path);
        return $path;
    }

    public function generateContract(Contract $contract, string $signatureBase64): string
    {
        $data = [
            'contract' => $contract,
            'booking' => $contract->booking,
            'client' => $contract->booking->client,
            'signature' => $signatureBase64,
            'spk_number' => $contract->spk_number,
            'date' => now()->format('d F Y'),
        ];

        $pdf = Pdf::loadView('pdfs.contract', $data);
        $pdf->setPaper('A4');
        $pdf->setOptions([
            'defaultFont' => 'sans-serif',
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => false,
        ]);

        $path = storage_path("app/public/contracts/spk-{$contract->id}.pdf");
        if (!is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        // Save PDF
        $pdf->save($path);

        // Update contract with path
        $contract->update(['pdf_path' => "storage/contracts/spk-{$contract->id}.pdf"]);

        return $path;
    }
}
