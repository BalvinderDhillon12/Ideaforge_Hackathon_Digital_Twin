import { jsPDF } from "jspdf";
import { PatientData, TreatmentPlan } from "../types";

export const generateClinicalReport = (patient: PatientData, treatment: TreatmentPlan) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // -- HEADER --
  // Dark blue header bar
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Ocora Clinical Summary", 20, 20);
  
  // Sub-info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
  doc.text("Neuro-Oncology AI Suite v2.4.1", pageWidth - 20, 30, { align: "right" });

  let yPos = 55;

  // -- SECTION 1: PATIENT DEMOGRAPHICS --
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.rect(15, yPos - 8, pageWidth - 30, 35, 'F');
  
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Patient Demographics", 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85); // Slate 700
  
  doc.text(`Patient ID: ${patient.id}`, 20, yPos);
  doc.text(`Age: ${patient.age}`, 80, yPos);
  doc.text(`Gender: ${patient.gender}`, 120, yPos);
  yPos += 8;
  doc.text(`Diagnosis: ${patient.diagnosis}`, 20, yPos);
  doc.text(`Grade: ${patient.tumorGrade}`, 80, yPos);
  doc.text(`Resectability: ${patient.resectability}`, 120, yPos);
  
  yPos += 25;

  // -- SECTION 2: TUMOR PHENOTYPE --
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Tumor Phenotype & Volumetrics", 20, yPos);
  doc.setLineWidth(0.5);
  doc.setDrawColor(203, 213, 225);
  doc.line(20, yPos + 2, pageWidth - 20, yPos + 2);
  yPos += 12;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);

  if (patient.phenotype) {
      // Grid layout for metrics
      doc.text(`Total Volume:`, 20, yPos);
      doc.setFont("helvetica", "bold");
      doc.text(`${patient.phenotype.volumeCm3.toFixed(2)} cm3`, 60, yPos);
      doc.setFont("helvetica", "normal");

      doc.text(`Midline Shift:`, 110, yPos);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(patient.phenotype.midlineShiftMm > 5 ? 220 : 51, patient.phenotype.midlineShiftMm > 5 ? 38 : 65, patient.phenotype.midlineShiftMm > 5 ? 38 : 85);
      doc.text(`${patient.phenotype.midlineShiftMm.toFixed(2)} mm`, 150, yPos);
      doc.setTextColor(51, 65, 85);
      doc.setFont("helvetica", "normal");
      
      yPos += 8;
      
      doc.text(`Edema Volume:`, 20, yPos);
      doc.text(`${patient.phenotype.edemaVolumeCm3.toFixed(2)} cm3`, 60, yPos);
      
      doc.text(`Necrosis Vol:`, 110, yPos);
      doc.text(`${patient.phenotype.necrosisVolumeCm3.toFixed(2)} cm3`, 150, yPos);
      
      yPos += 8;
      
      doc.text(`Enhancing:`, 20, yPos);
      doc.text(`${patient.phenotype.enhancingPercentage}%`, 60, yPos);
      
      doc.text(`Non-Enhancing:`, 110, yPos);
      doc.text(`${patient.phenotype.nonEnhancingPercentage}%`, 150, yPos);
      
      yPos += 8;
      
      doc.text(`Resectability Score:`, 20, yPos);
      doc.setFont("helvetica", "bold");
      doc.text(`${patient.phenotype.resectabilityScore}%`, 60, yPos);
      doc.setFont("helvetica", "normal");
  } else {
      doc.text("No phenotype data available.", 20, yPos);
  }
  yPos += 15;

  // -- SECTION 3: RADIOMICS --
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Radiomic Signature (Top Features)", 20, yPos);
  doc.line(20, yPos + 2, pageWidth - 20, yPos + 2);
  yPos += 12;
  
  doc.setFontSize(9);
  doc.setFont("courier", "normal");
  doc.setTextColor(71, 85, 105);
  
  if (patient.radiomics) {
      let xOffset = 20;
      patient.radiomics.slice(0, 6).forEach((r, i) => {
          if (i % 2 === 0 && i !== 0) {
              yPos += 6;
              xOffset = 20;
          } else if (i % 2 !== 0) {
              xOffset = 110;
          }
          doc.text(`[ ] ${r.feature}: ${r.actualValue}`, xOffset, yPos);
      });
  }
  yPos += 20;

  // -- SECTION 4: TREATMENT PLAN --
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("AI Recommended Treatment Strategy", 20, yPos);
  yPos += 8;

  // Recommendation Box
  doc.setFillColor(240, 253, 250); // Teal 50
  doc.setDrawColor(13, 148, 136); // Teal 600
  doc.setLineWidth(0.5);
  doc.roundedRect(15, yPos, pageWidth - 30, 50, 3, 3, 'FD');
  
  yPos += 10;
  doc.setFontSize(16);
  doc.setTextColor(15, 118, 110); // Teal 800
  doc.text(`${treatment.name}`, 25, yPos);
  
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "bold");
  doc.text(`Confidence Score: ${(treatment.probability * 100).toFixed(1)}%`, 140, yPos);
  
  yPos += 10;
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Expected Survival: ${treatment.expectedSurvival.toFixed(1)} Months`, 25, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  const splitDesc = doc.splitTextToSize(treatment.description.replace(/•/g, '-'), pageWidth - 50);
  doc.text(splitDesc, 25, yPos);

  // -- FOOTER --
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(248, 250, 252);
  doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Execution ID: ${patient.audit?.executionId || "N/A"} | Model: ${patient.audit?.modelVersion || "Unknown"}`, 20, pageHeight - 8);
  doc.text("INVESTIGATIONAL DEVICE. NOT FOR PRIMARY DIAGNOSTIC USE.", pageWidth - 20, pageHeight - 8, { align: "right" });

  // Save
  doc.save(`${patient.id}_Clinical_Summary.pdf`);
};