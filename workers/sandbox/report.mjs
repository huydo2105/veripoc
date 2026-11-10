import { receiptFromWorker, publicAnchor } from "../../packages/core/receipt.mjs";

export function prepareWorkerReports(results) {
  return results.map(result => {
    try {
      const receipt = receiptFromWorker(result);
      return { result, receipt, anchor: publicAnchor(receipt), receiptError: null };
    } catch (error) {
      return { result, receipt: null, anchor: null, receiptError: String(error.message) };
    }
  });
}
