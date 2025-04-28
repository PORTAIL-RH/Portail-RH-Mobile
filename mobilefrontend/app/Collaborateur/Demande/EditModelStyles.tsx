import { Dimensions } from "react-native"

const { width, height } = Dimensions.get("window")

// Styles for the edit modal
const styles = {
  editModal: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 16,
    padding: 20,
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  editScrollContainer: {
    maxHeight: height * 0.5,
  },
  editField: {
    marginBottom: 16,
  },
  editFieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  editInput: {
    fontSize: 16,
    padding: 0, // Remove padding since it's now in the container
    color: "inherit", // This will inherit the text color from themeStyles.text
  },
  editModalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  editActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
}

export default styles

