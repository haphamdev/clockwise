import { validateHeadersWithOptional } from "./csv-parser";

describe("validateHeadersWithOptional", () => {
  it("should return error when required headers are missing", () => {
    const result = validateHeadersWithOptional(
      ["name"],
      ["name", "description"],
      ["members"],
    );

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.message).toContain("Missing: description");
    }
  });

  it("should succeed when only required headers are present", () => {
    const result = validateHeadersWithOptional(
      ["name", "description"],
      ["name", "description"],
      ["members", "managers"],
    );

    expect("columnMap" in result).toBe(true);
    if ("columnMap" in result) {
      expect(result.columnMap.get("name")).toBe(0);
      expect(result.columnMap.get("description")).toBe(1);
      expect(result.columnMap.has("members")).toBe(false);
      expect(result.columnMap.has("managers")).toBe(false);
    }
  });

  it("should include optional headers when present", () => {
    const result = validateHeadersWithOptional(
      ["name", "description", "members", "managers"],
      ["name", "description"],
      ["members", "managers"],
    );

    expect("columnMap" in result).toBe(true);
    if ("columnMap" in result) {
      expect(result.columnMap.get("name")).toBe(0);
      expect(result.columnMap.get("description")).toBe(1);
      expect(result.columnMap.get("members")).toBe(2);
      expect(result.columnMap.get("managers")).toBe(3);
    }
  });

  it("should include only the optional headers that are present", () => {
    const result = validateHeadersWithOptional(
      ["name", "description", "managers"],
      ["name", "description"],
      ["members", "managers"],
    );

    expect("columnMap" in result).toBe(true);
    if ("columnMap" in result) {
      expect(result.columnMap.has("members")).toBe(false);
      expect(result.columnMap.get("managers")).toBe(2);
    }
  });

  it("should normalize header casing", () => {
    const result = validateHeadersWithOptional(
      ["Name", "DESCRIPTION", "Members"],
      ["name", "description"],
      ["members", "managers"],
    );

    expect("columnMap" in result).toBe(true);
    if ("columnMap" in result) {
      expect(result.columnMap.get("name")).toBe(0);
      expect(result.columnMap.get("description")).toBe(1);
      expect(result.columnMap.get("members")).toBe(2);
    }
  });
});
