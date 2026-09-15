import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  authUserId: text("auth_user_id").notNull(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["doctor", "patient"] }).notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("idx_users_auth_user_id").on(table.authUserId)]);

export const pregnancies = sqliteTable("pregnancies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientName: text("patient_name").notNull(), medicalRecordNumber: text("medical_record_number").notNull(),
  age: integer("age").notNull().default(0), doctorName: text("doctor_name").notNull().default(""),
  mobile: text("mobile").notNull(), dateOfBirth: text("date_of_birth").notNull(), nationality: text("nationality").notNull().default(""),
  bloodType: text("blood_type").notNull().default(""), rhFactor: text("rh_factor").notNull().default(""),
  heightCm: integer("height_cm"), prePregnancyWeightKg: text("pre_pregnancy_weight_kg"),
  allergies: text("allergies").notNull().default(""), chronicDiseases: text("chronic_diseases").notNull().default(""),
  currentMedications: text("current_medications").notNull().default(""), gravida: integer("gravida").notNull().default(1),
  para: integer("para").notNull().default(0), abortions: integer("abortions").notNull().default(0),
  livingChildren: integer("living_children").notNull().default(0), previousPregnancyNotes: text("previous_pregnancy_notes").notNull().default(""),
  pastSurgicalHistory: text("past_surgical_history").notNull().default(""),
  lastMenstrualPeriod: text("last_menstrual_period").notNull(), estimatedDueDate: text("estimated_due_date").notNull(),
  fetusCount: integer("fetus_count").notNull().default(1), pregnancyRisk: text("pregnancy_risk").notNull().default("منخفض"),
  doctorUserId: text("doctor_user_id").notNull(), patientUserId: text("patient_user_id"), inviteCode: text("invite_code").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("idx_pregnancies_mrn").on(table.medicalRecordNumber), uniqueIndex("idx_pregnancies_invite_code").on(table.inviteCode),
  index("idx_pregnancies_doctor_user_id").on(table.doctorUserId), index("idx_pregnancies_patient_user_id").on(table.patientUserId),
]);

export const visits = sqliteTable("visits", {
  id: integer("id").primaryKey({ autoIncrement: true }), pregnancyId: integer("pregnancy_id").notNull().references(() => pregnancies.id),
  visitType: text("visit_type", { enum: ["monthly", "emergency"] }).notNull(), visitDate: text("visit_date").notNull(),
  visitNumber: integer("visit_number").notNull().default(0), bValue: text("b_value").notNull().default(""),
  gestationalWeek: integer("gestational_week").notNull(), weightKg: text("weight_kg"), bloodPressure: text("blood_pressure"),
  pulse: integer("pulse"), temperature: text("temperature"), symptoms: text("symptoms").notNull().default(""),
  fetalHeartRate: integer("fetal_heart_rate"), fetalMovement: text("fetal_movement").notNull().default(""),
  fundalHeightCm: text("fundal_height_cm"), fetalPresentation: text("fetal_presentation").notNull().default(""),
  ultrasoundSummary: text("ultrasound_summary").notNull().default(""), labResults: text("lab_results").notNull().default(""),
  assessment: text("assessment").notNull().default(""), plan: text("plan").notNull().default(""),
  medications: text("medications").notNull().default(""), emergencyReason: text("emergency_reason").notNull().default(""),
  emergencyOutcome: text("emergency_outcome").notNull().default(""), nextVisitDate: text("next_visit_date"),
  createdBy: text("created_by").notNull(), createdAt: text("created_at").notNull(),
}, (table) => [index("idx_visits_pregnancy_date").on(table.pregnancyId, table.visitDate)]);

export const otpCodes = sqliteTable("otp_codes", {
  email: text("email").primaryKey(),
  codeHash: text("code_hash").notNull(),
  expiresAt: integer("expires_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const labResults = sqliteTable("lab_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pregnancyId: integer("pregnancy_id").notNull().references(() => pregnancies.id),
  investigation: text("investigation").notNull(),
  examination: text("examination").notNull(),
  resultDate: text("result_date").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_lab_results_pregnancy_date").on(table.pregnancyId, table.resultDate)]);
