// style/homeStyles.ts
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7fa" },
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  content: { paddingHorizontal: 18, paddingTop: 28, paddingBottom: 160 },

  header: { marginBottom: 12, marginTop: 30 },
  hello: { fontSize: 28, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 16, color: "#374151", marginTop: 4 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 22,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#e6eaf0",
    shadowColor: "#94a3b8",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 8,
  },

  iconRow: { flexDirection: "row", gap: 12, marginBottom: 6 },

  iconWrap: {
    backgroundColor: "#eef1f6",
    padding: 14,
    borderRadius: 18,
    marginBottom: 18,
  },
  iconWrapActive: { backgroundColor: "#ffe9df" },

  row: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  label: {
    width: 70,
    fontSize: 17,
    fontWeight: "700",
    color: "#1f2937",
  },
  colon: {
    width: 12,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: "#1f2937",
  },
  value: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
    flex: 1,
    marginLeft: 12,
    paddingVertical: 2,
  },

  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#e5e9ef",
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 12,
    flex: 1,
  },

  selectText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    flex: 1,
    paddingVertical: 2,
  },

  selectIconWrap: { width: 18, alignItems: "center" },

  inputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    flex: 1,
    backgroundColor: "#e8edf5",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 12,
    fontSize: 16,
    color: "#0f172a",
    maxWidth: 160,
  },

  okButton: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  okButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  buttonPending: { backgroundColor: "#ef4444" },
  buttonSent: { backgroundColor: "#22c55e" },

  statusValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 30,
    textAlign: "center",
  },

  timeRow: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  timeLabel: { fontSize: 20, fontWeight: "700", width: 140 },
  timeColon: {
    width: 14,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
  timeValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },

  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 28,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#22c55e",
    borderRadius: 9999,
    alignItems: "center",
  },
  actionText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.2)" },
  modalContent: {
    position: "absolute",
    left: "5%",
    right: "5%",
    top: 120,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  optionRow: { paddingVertical: 12, paddingHorizontal: 14 },
  optionRowActive: { backgroundColor: "#eef2ff" },
  optionText: { fontSize: 16, fontWeight: "600" },
  optionTextActive: { color: "#1d4ed8", fontWeight: "700" },

  bottomContainer: { padding: 16 },
  bottomRow: { flexDirection: "row", gap: 12 },

  bottomButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  bottomActive: { backgroundColor: "#ffe9df", borderColor: "#fdc9a9" },
  bottomText: { marginTop: 6, fontWeight: "700", fontSize: 18 },
  bottomActiveText: {
    marginTop: 6,
    fontWeight: "700",
    fontSize: 18,
    color: "#e8532a",
  },
});
