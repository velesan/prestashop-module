{*
 * 2007-2026 PrestaShop.
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License 3.0 (AFL-3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/AFL-3.0
 *
 * @author    PrestaShop SA <contact@prestashop.com>
 * @copyright 2007-2026 PrestaShop SA
 * @license   https://opensource.org/licenses/AFL-3.0 Academic Free License 3.0 (AFL-3.0)
 *}
{* Texts for views/js/tradeDocuments.jquery.js - included once on every page that mounts the component *}
<script type="text/javascript">
    window.GKTradeDocsI18n = {
        heading: '{l s='Customs documents' mod='globkuriermodule' js=1}',
        open: '{l s='Documents' mod='globkuriermodule' js=1}',
        close: '{l s='Close' mod='globkuriermodule' js=1}',
        loading: '{l s='Checking customs documents...' mod='globkuriermodule' js=1}',
        loadError: '{l s='Could not check customs documents.' mod='globkuriermodule' js=1}',
        retry: '{l s='Try again' mod='globkuriermodule' js=1}',
        notRequired: '{l s='This shipment does not require customs documents.' mod='globkuriermodule' js=1}',
        notRequiredYet: '{l s='GlobKurier has not listed any required customs documents for this shipment yet. Check again in a moment.' mod='globkuriermodule' js=1}',
        intro: '{l s='The carrier needs these documents for customs clearance. Send them electronically (ETD) to speed up delivery.' mod='globkuriermodule' js=1}',
        statusMissing: '{l s='Documents required' mod='globkuriermodule' js=1}',
        statusReady: '{l s='Ready to send' mod='globkuriermodule' js=1}',
        statusSent: '{l s='Sent to carrier' mod='globkuriermodule' js=1}',
        shipmentStatus: '{l s='Shipment' mod='globkuriermodule' js=1}',
        requiredTypes: '{l s='Required documents' mod='globkuriermodule' js=1}',
        requiredOneOf: '{l s='one of' mod='globkuriermodule' js=1}',
        step1: '{l s='1. Add documents' mod='globkuriermodule' js=1}',
        step2: '{l s='2. Send to carrier' mod='globkuriermodule' js=1}',
        uploadedHeading: '{l s='Uploaded documents' mod='globkuriermodule' js=1}',
        chooseFiles: '{l s='Choose PDF files' mod='globkuriermodule' js=1}',
        fileHint: '{l s='PDF, up to 5 MB per file. You can add several files at once.' mod='globkuriermodule' js=1}',
        typeLabel: '{l s='Document type' mod='globkuriermodule' js=1}',
        descriptionLabel: '{l s='Document description' mod='globkuriermodule' js=1}',
        descriptionPlaceholder: '{l s='e.g. Invoice no. 12/2026' mod='globkuriermodule' js=1}',
        removeStaged: '{l s='Remove file from list' mod='globkuriermodule' js=1}',
        uploadCount: '{l s='Upload files (%s)' mod='globkuriermodule' js=1}',
        uploadedCount: '{l s='Documents added: %s.' mod='globkuriermodule' js=1}',
        retentionHint: '{l s='Documents in the same group are interchangeable. GlobKurier stores them for 1 year.' mod='globkuriermodule' js=1}',
        colName: '{l s='File' mod='globkuriermodule' js=1}',
        colType: '{l s='Type' mod='globkuriermodule' js=1}',
        colStatus: '{l s='Status' mod='globkuriermodule' js=1}',
        colActions: '{l s='Actions' mod='globkuriermodule' js=1}',
        sentBadge: '{l s='Sent' mod='globkuriermodule' js=1}',
        notSentBadge: '{l s='Not sent' mod='globkuriermodule' js=1}',
        download: '{l s='Download' mod='globkuriermodule' js=1}',
        delete: '{l s='Delete' mod='globkuriermodule' js=1}',
        confirmDelete: '{l s='Delete document %s? This cannot be undone.' mod='globkuriermodule' js=1}',
        deleted: '{l s='Document deleted.' mod='globkuriermodule' js=1}',
        sync: '{l s='Send to carrier' mod='globkuriermodule' js=1}',
        synced: '{l s='Documents sent to the carrier.' mod='globkuriermodule' js=1}',
        downloadError: '{l s='Could not download the document.' mod='globkuriermodule' js=1}',
        errorInvalidPdf: '{l s='The file must be a PDF document.' mod='globkuriermodule' js=1}',
        errorTooLarge: '{l s='The file is too large (max 5 MB).' mod='globkuriermodule' js=1}',
        errorMissingFields: '{l s='Choose a document type and enter a description.' mod='globkuriermodule' js=1}',
        errorNotFound: '{l s='Shipment not found.' mod='globkuriermodule' js=1}',
        errorUploadFailed: '{l s='The file could not be uploaded to the shop server.' mod='globkuriermodule' js=1}',
        errorGeneric: '{l s='Something went wrong. Please try again.' mod='globkuriermodule' js=1}',
        reasonCanceled: '{l s='The shipment was canceled - customs documents are no longer needed.' mod='globkuriermodule' js=1}',
        reasonFinished: '{l s='The shipment has already been delivered or returned - documents can no longer be sent to the carrier.' mod='globkuriermodule' js=1}',
        reasonIssue: '{l s='The shipment needs clarification at GlobKurier. Contact customer service - we will send the documents once it is resolved.' mod='globkuriermodule' js=1}',
        reasonNotStarted: '{l s='The shipment is waiting to be processed. You can add documents now and send them to the carrier once its status changes to In progress.' mod='globkuriermodule' js=1}',
        reasonStatusUnknown: '{l s='Could not check the shipment status. Please try again shortly.' mod='globkuriermodule' js=1}',
        reasonMissing: '{l s='Add a document of a required type to send it to the carrier.' mod='globkuriermodule' js=1}',
        reasonNothingToSend: '{l s='All documents are already with the carrier.' mod='globkuriermodule' js=1}',
        gkStatus: {
            NEW_SHIPMENT: '{l s='New' mod='globkuriermodule' js=1}',
            IN_PROGRESS: '{l s='In progress' mod='globkuriermodule' js=1}',
            IN_TRANSIT: '{l s='In transit' mod='globkuriermodule' js=1}',
            DELIVERED: '{l s='Delivered' mod='globkuriermodule' js=1}',
            RETURNED_TO_SENDER: '{l s='Returned to sender' mod='globkuriermodule' js=1}',
            CANCELED: '{l s='Canceled' mod='globkuriermodule' js=1}',
            CUSTOMS_CLEARANCE_ISSUE: '{l s='Customs clearance issue' mod='globkuriermodule' js=1}',
            REQUIRES_CLARIFICATION: '{l s='Requires clarification' mod='globkuriermodule' js=1}',
            AWAITING_CARRIER_CANCELLATION: '{l s='Awaiting cancellation' mod='globkuriermodule' js=1}'
        }
    };
</script>
