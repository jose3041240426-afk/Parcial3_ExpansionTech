// Avatar Upload Service - Usa Supabase Storage
import { supabase } from "./supabaseClient";

const SUPABASE_URL = "https://btptdsmosmsafuxejlrt.supabase.co";
const BUCKET = "avatars";

/**
 * Sube una imagen de avatar a Supabase Storage usando fetch + FormData.
 * Bucket requerido: "avatars" (público).
 */
export const uploadToCloudinary = async (imageUri) => {
  try {
    // Obtener usuario actual
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("No se encontró usuario autenticado.");

    const user = session.user;
    const fileName = `avatar_${Date.now()}.jpg`;
    const filePath = `${user.id}/${fileName}`;

    // Preparar FormData con la imagen
    const formData = new FormData();
    formData.append("", {
      uri: imageUri,
      type: "image/jpeg",
      name: fileName,
    });

    // Subir directamente via REST API de Supabase Storage
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filePath}`;
    
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "x-upsert": "true",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log("Supabase Storage Error:", errorData);
      throw new Error(errorData.message || errorData.error || "Error al subir imagen");
    }

    // Obtener URL pública
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filePath}?t=${Date.now()}`;
    return publicUrl;
  } catch (error) {
    console.error("Avatar Upload Error:", error);
    throw error;
  }
};
