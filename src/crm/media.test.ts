import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkImageFile,
  cloudinaryUploader,
  cloudinaryUploadUrl,
  folderSegment,
  imageUrl,
  MAX_UPLOAD_BYTES,
  parseCloudinaryResponse,
  UploadError,
} from "./media";

const CLD = "https://res.cloudinary.com/demo/image/upload/v1712/crm/properties/RE-1/abc.jpg";

describe("imageUrl", () => {
  it("Cloudinary URL-be transzformációt tesz, mást nem bánt", () => {
    expect(imageUrl(CLD)).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1712/crm/properties/RE-1/abc.jpg"
    );
    expect(imageUrl(CLD, { width: 640, height: 400 })).toContain(
      "/upload/f_auto,q_auto,c_fill,w_640,h_400/v1712/"
    );
    expect(imageUrl(CLD, { width: 1200 })).toContain("/upload/f_auto,q_auto,c_limit,w_1200/");
    expect(imageUrl("https://example.com/a.jpg", { width: 10 })).toBe("https://example.com/a.jpg");
    expect(imageUrl("data:image/jpeg;base64,xx")).toBe("data:image/jpeg;base64,xx");
  });
});

describe("Cloudinary válasz", () => {
  it("sikeres válaszból kiveszi az URL-t és a public_id-t", () => {
    expect(
      parseCloudinaryResponse(200, {
        secure_url: CLD,
        public_id: "crm/properties/RE-1/abc",
        width: 1600,
        height: 1200,
      })
    ).toEqual({ url: CLD, publicId: "crm/properties/RE-1/abc", width: 1600, height: 1200 });
  });

  it("hibás válasznál a Cloudinary hibaüzenetét adja tovább", () => {
    expect(() =>
      parseCloudinaryResponse(400, { error: { message: "Upload preset not found" } })
    ).toThrow("Upload preset not found");
    expect(() => parseCloudinaryResponse(500, null)).toThrow("HTTP 500");
  });
});

describe("fájlellenőrzés és mappanév", () => {
  it("csak képet és max. 10 MB-ot enged", () => {
    const file = (type: string, size: number) => ({ type, size, name: "x" }) as unknown as File;
    expect(() => checkImageFile(file("image/jpeg", 1000))).not.toThrow();
    expect(() => checkImageFile(file("application/pdf", 1000))).toThrow(UploadError);
    expect(() => checkImageFile(file("image/png", MAX_UPLOAD_BYTES + 1))).toThrow(
      expect.objectContaining({ code: "too-large" })
    );
  });

  it("mappanév: ékezet és tiltott karakter nélkül", () => {
    expect(folderSegment("Árvíztűrő tükörfúrógép / 2.")).toBe("Arvizturo-tukorfurogep-2");
    expect(folderSegment("RE-1001")).toBe("RE-1001");
  });
});

describe("cloudinaryUploader", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("unsigned presettel, mappával POST-ol, és jelzi a haladást", async () => {
    const sent: { url?: string; method?: string; form?: FormData } = {};
    class FakeXhr {
      status = 0;
      response: unknown = null;
      responseType = "";
      upload: {
        onprogress?: (e: { lengthComputable: boolean; loaded: number; total: number }) => void;
      } = {};
      onload?: () => void;
      onerror?: () => void;
      onabort?: () => void;
      open(method: string, url: string) {
        sent.method = method;
        sent.url = url;
      }
      send(form: FormData) {
        sent.form = form;
        this.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 });
        this.status = 200;
        this.response = { secure_url: CLD, public_id: "p1", width: 10, height: 20 };
        this.onload?.();
      }
      abort() {
        this.onabort?.();
      }
    }
    vi.stubGlobal("XMLHttpRequest", FakeXhr);

    const progress: number[] = [];
    const file = new File([new Uint8Array([1, 2, 3])], "nappali.jpg", { type: "image/jpeg" });
    const img = await cloudinaryUploader({
      cloudName: "demo",
      uploadPreset: "crm-unsigned",
    }).upload(file, { folder: "crm/properties/RE-1", onProgress: (p) => progress.push(p) });

    expect(sent.method).toBe("POST");
    expect(sent.url).toBe(cloudinaryUploadUrl("demo"));
    expect(sent.form?.get("upload_preset")).toBe("crm-unsigned");
    expect(sent.form?.get("folder")).toBe("crm/properties/RE-1");
    expect((sent.form?.get("file") as File).name).toBe("nappali.jpg");
    // API secret soha nem mehet a böngészőből:
    expect(sent.form?.has("api_key")).toBe(false);
    expect(sent.form?.has("signature")).toBe(false);
    expect(progress).toEqual([50]);
    expect(img).toEqual({ url: CLD, publicId: "p1", width: 10, height: 20 });
  });

  it("hálózati hibánál network kódú hibát dob", async () => {
    vi.stubGlobal(
      "XMLHttpRequest",
      class {
        upload = {};
        onerror?: () => void;
        open() {}
        send() {
          this.onerror?.();
        }
      }
    );
    const file = new File(["x"], "a.png", { type: "image/png" });
    await expect(
      cloudinaryUploader({ cloudName: "demo", uploadPreset: "p" }).upload(file)
    ).rejects.toMatchObject({ code: "network" });
  });
});
