export type LanguageCode = 'en' | 'es' | 'fr' | 'de';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Header & Nav
    searchPlaceholder: "Search for tools (e.g. 'Merge PDF', 'Compress Word', 'OCR')",
    allTools: "All Tools",
    compress: "Compress",
    convert: "Convert",
    recent: "Recent",
    recentlyUsed: "Recently Used",
    freeForever: "Free Forever",
    admin: "Admin",
    share: "Share",
    shareTitle: "Share this page or tool",
    linkCopied: "Link copied!",
    selectLanguage: "Language",
    toggleTheme: "Toggle Theme",
    noRecentTools: "No recently used tools yet.",

    // Hero Drag & Drop
    heroTitle: "Drag & Drop Files Here",
    heroSub: "PDF, Word, Excel, JPG, PNG, and more (Max 1GB) • Zero Sign Up Required",
    autoDetect: "Auto-Detect",

    // Sidebar
    categories: "Categories",
    privacyPromiseTitle: "Privacy Promise:",
    privacyPromiseDesc: "All files are processed locally or deleted instantly after download. No accounts required.",

    // Categories
    cat_All: "All",
    cat_PDF_Tools: "PDF Tools",
    cat_Word_Tools: "Word Tools",
    cat_Excel_Tools: "Excel Tools",
    cat_PowerPoint_Tools: "PowerPoint Tools",
    cat_Image_Tools: "Image Tools",
    cat_Compression_Tools: "Compression Tools",
    cat_Conversion_Tools: "Conversion Tools",

    // Tool Card & Grid
    allAvailableTools: "All Available Tools",
    openTool: "Open →",
    popularBadge: "Popular",
    newBadge: "New",
    proBadge: "Pro",
    freeBadge: "Free",
    batchBadge: "Batch",
    noToolsMatch: "No tools match your query",
    trySearching: 'Try searching for terms like "PDF", "Compress", "Word", or "Converter".',
    showAllTools: "Show All Tools",
    searchResultPrefix: "Search:",

    // Footer Features
    feat_noAccountTitle: "No Account Needed",
    feat_noAccountDesc: "Zero signup or login requirements. Use all PDF, Word, Excel, and Image tools instantly.",
    feat_secureTitle: "100% Secure & Private",
    feat_secureDesc: "Files process directly in your browser memory or auto-delete from temporary buffers in 15 mins.",
    feat_adsenseTitle: "AdSense Compliant",
    feat_adsenseDesc: "Designed according to Google webmaster and advertisement quality policies with transparent privacy terms.",
    feat_batchTitle: "Batch Processing",
    feat_batchDesc: "Convert, compress, and merge multiple documents simultaneously with instant ZIP archive export.",

    // Footer Sections
    footerBrandDesc: "The premier online suite for fast, secure file conversions, PDF editing, compression, and image manipulation. Free forever for everyone with zero signup restrictions.",
    footerTrademarks: "All trademarks, product names, and company logos mentioned are property of their respective owners.",
    popularToolsTitle: "Popular Tools",
    categoriesTitle: "Categories",
    legalPolicyTitle: "Legal & Policy",
    knowledgeHelpTitle: "Knowledge & Help",
    privacyPolicy: "Privacy Policy",
    termsConditions: "Terms & Conditions",
    disclaimer: "Disclaimer",
    aboutUs: "About Us",
    blogKnowledge: "Knowledge Hub / Guides",
    faqHelp: "FAQ & Questions",
    contactSupport: "Contact & Support",
    copyrightText: "pdfeditfy.com. All rights reserved. Free online document workstation.",

    // Cookie Banner
    cookieTitle: "Privacy & Cookie Preferences",
    cookieText: "pdfeditfy.com uses essential browser storage and standard Google AdSense cookies to personalize advertisements, maintain session settings, and analyze anonymous site traffic.",
    acceptAll: "Accept All & Continue",
    essentialOnly: "Essential Only",
    viewPrivacy: "Privacy Policy",

    // Tool Names & Descriptions
    tool_edit_pdf_name: "Edit PDF",
    tool_edit_pdf_desc: "Add text, images, shapes, highlight text, and draw or sign directly on your PDF document.",
    tool_merge_pdf_name: "Merge PDF",
    tool_merge_pdf_desc: "Combine multiple PDF files into one organized single document in seconds.",
    tool_split_pdf_name: "Split PDF",
    tool_split_pdf_desc: "Extract specific pages or split a large PDF into separate smaller documents.",
    tool_compress_pdf_name: "Compress PDF",
    tool_compress_pdf_desc: "Reduce PDF file size significantly while retaining maximum visual document quality.",
    tool_organize_pdf_name: "Rearrange & Rotate Pages",
    tool_organize_pdf_desc: "Reorder, delete, or rotate pages 90°, 180°, or 270° in any PDF file.",
    tool_watermark_pdf_name: "Watermark PDF",
    tool_watermark_pdf_desc: "Protect document copyrights by applying custom text or logo image watermarks.",
    tool_lock_pdf_name: "Protect & Lock PDF",
    tool_lock_pdf_desc: "Encrypt PDF documents with a strong password to prevent unauthorized access.",
    tool_unlock_pdf_name: "Unlock PDF",
    tool_unlock_pdf_desc: "Remove password protection and restriction locks from secured PDF files.",
    tool_pdf_to_word_name: "PDF to Word",
    tool_pdf_to_word_desc: "Convert PDF files into fully editable Microsoft Word documents (.docx or .doc).",
    tool_word_to_pdf_name: "Word to PDF",
    tool_word_to_pdf_desc: "Convert Word documents (.docx, .doc, .rtf, .odt) into standard professional PDF files.",
    tool_pdf_to_excel_name: "PDF to Excel",
    tool_pdf_to_excel_desc: "Extract tables and structured data from PDF into editable XLSX or CSV spreadsheets.",
    tool_excel_to_pdf_name: "Excel to PDF",
    tool_excel_to_pdf_desc: "Convert Excel spreadsheets (.xlsx, .xls, .csv) into clean PDF documents.",
    tool_pdf_to_image_name: "PDF to Image",
    tool_pdf_to_image_desc: "Convert PDF document pages into high-resolution JPG, PNG, or WEBP images.",
    tool_image_to_pdf_name: "Image to PDF",
    tool_image_to_pdf_desc: "Turn photos, scans, and graphic images (JPG, PNG, WEBP) into a clean PDF.",
    tool_image_converter_name: "Image Converter",
    tool_image_converter_desc: "Convert between image formats (PNG, JPG, WEBP, AVIF, BMP) with zero quality loss.",
    tool_image_compressor_name: "Image Compressor",
    tool_image_compressor_desc: "Compress JPG, PNG, and WEBP image files for faster web loading.",
    tool_image_resizer_name: "Image Resizer",
    tool_image_resizer_desc: "Resize pixel dimensions, change aspect ratio, or crop images with live preview.",
    tool_edit_word_name: "Word Editor & Viewer",
    tool_edit_word_desc: "Open, read, modify text content, and export Microsoft Word documents.",
    tool_word_to_txt_name: "Word to Plain Text",
    tool_word_to_txt_desc: "Extract raw text contents and paragraphs from Word documents.",
    tool_edit_excel_name: "Excel Spreadsheet Editor",
    tool_edit_excel_desc: "View, edit cell data, compute totals, and modify XLSX and CSV spreadsheets.",
    tool_csv_excel_converter_name: "CSV ↔ Excel Converter",
    tool_csv_excel_converter_desc: "Convert CSV data files into formatted XLSX workbooks and vice versa.",
    tool_ppt_to_pdf_name: "PowerPoint to PDF",
    tool_ppt_to_pdf_desc: "Convert PPTX presentation slides into high-resolution PDF pages.",
    tool_ocr_reader_name: "OCR Text Extractor",
    tool_ocr_reader_desc: "Extract text from scanned PDF documents, invoices, receipts, and images.",
    tool_universal_converter_name: "Batch Universal Converter",
    tool_universal_converter_desc: "Upload multiple files of any supported format and convert or compress in bulk."
  },
  es: {
    // Header & Nav
    searchPlaceholder: "Buscar herramientas (ej. 'Unir PDF', 'Comprimir Word', 'OCR')",
    allTools: "Todas las Herramientas",
    compress: "Comprimir",
    convert: "Convertir",
    recent: "Reciente",
    recentlyUsed: "Usado Recientemente",
    freeForever: "Gratis Siempre",
    admin: "Admin",
    share: "Compartir",
    shareTitle: "Compartir esta página o herramienta",
    linkCopied: "¡Enlace copiado!",
    selectLanguage: "Idioma",
    toggleTheme: "Cambiar Tema",
    noRecentTools: "No hay herramientas recientes.",

    // Hero Drag & Drop
    heroTitle: "Arrastra y Suelta Tus Archivos Aquí",
    heroSub: "PDF, Word, Excel, JPG, PNG y más (Máx 1GB) • Sin Necesidad de Registro",
    autoDetect: "Detección Automática",

    // Sidebar
    categories: "Categorías",
    privacyPromiseTitle: "Promesa de Privacidad:",
    privacyPromiseDesc: "Todos los archivos se procesan localmente o se eliminan al instante. Sin cuentas requeridas.",

    // Categories
    cat_All: "Todas",
    cat_PDF_Tools: "Herramientas PDF",
    cat_Word_Tools: "Herramientas Word",
    cat_Excel_Tools: "Herramientas Excel",
    cat_PowerPoint_Tools: "Herramientas PowerPoint",
    cat_Image_Tools: "Herramientas Imagen",
    cat_Compression_Tools: "Herramientas de Compresión",
    cat_Conversion_Tools: "Herramientas de Conversión",

    // Tool Card & Grid
    allAvailableTools: "Todas las Herramientas Disponibles",
    openTool: "Abrir →",
    popularBadge: "Popular",
    newBadge: "Nuevo",
    proBadge: "Pro",
    freeBadge: "Gratis",
    batchBadge: "Lote",
    noToolsMatch: "No se encontraron herramientas con tu búsqueda",
    trySearching: 'Intenta buscar términos como "PDF", "Comprimir", "Word" o "Convertir".',
    showAllTools: "Mostrar Todas las Herramientas",
    searchResultPrefix: "Búsqueda:",

    // Footer Features
    feat_noAccountTitle: "Sin Cuenta Requerida",
    feat_noAccountDesc: "Cero requisitos de inicio de sesión. Utiliza todas las herramientas de PDF, Word, Excel e Imagen al instante.",
    feat_secureTitle: "100% Seguro y Privado",
    feat_secureDesc: "Los archivos se procesan directamente en la memoria de tu navegador o se eliminan automáticamente.",
    feat_adsenseTitle: "Conforme con AdSense",
    feat_adsenseDesc: "Diseñado según las políticas de calidad de Google con términos de privacidad transparentes.",
    feat_batchTitle: "Procesamiento por Lotes",
    feat_batchDesc: "Convierte, comprime y une varios documentos simultáneamente con descarga instantánea en ZIP.",

    // Footer Sections
    footerBrandDesc: "La suite online líder para conversiones rápidas y seguras, edición de PDF, compresión y manipulación de imágenes. Gratis para todos.",
    footerTrademarks: "Todas las marcas comerciales, nombres de productos y logotipos mencionados son propiedad de sus respectivos dueños.",
    popularToolsTitle: "Herramientas Populares",
    categoriesTitle: "Categorías",
    legalPolicyTitle: "Legal y Políticas",
    knowledgeHelpTitle: "Centro de Ayuda y Guías",
    privacyPolicy: "Política de Privacidad",
    termsConditions: "Términos y Condiciones",
    disclaimer: "Descargo de Responsabilidad",
    aboutUs: "Sobre Nosotros",
    blogKnowledge: "Blog y Guías",
    faqHelp: "Preguntas Frecuentes",
    contactSupport: "Contacto y Soporte",
    copyrightText: "pdfeditfy.com. Todos los derechos reservados. Estación de trabajo de documentos gratuita.",

    // Cookie Banner
    cookieTitle: "Preferencias de Privacidad y Cookies",
    cookieText: "pdfeditfy.com utiliza almacenamiento local del navegador y cookies estándar de Google AdSense para personalizar anuncios y analizar el tráfico de forma anónima.",
    acceptAll: "Aceptar Todo y Continuar",
    essentialOnly: "Solo Esenciales",
    viewPrivacy: "Política de Privacidad",

    // Tool Names & Descriptions
    tool_edit_pdf_name: "Editar PDF",
    tool_edit_pdf_desc: "Añade texto, imágenes, formas, resalta texto y dibuja o firma directamente en tu documento PDF.",
    tool_merge_pdf_name: "Unir PDF",
    tool_merge_pdf_desc: "Combina varios archivos PDF en un solo documento organizado en cuestión de segundos.",
    tool_split_pdf_name: "Dividir PDF",
    tool_split_pdf_desc: "Extrae páginas específicas o divide un PDF grande en varios documentos más pequeños.",
    tool_compress_pdf_name: "Comprimir PDF",
    tool_compress_pdf_desc: "Reduce significativamente el tamaño del archivo PDF manteniendo la máxima calidad visual.",
    tool_organize_pdf_name: "Reorganizar y Rotar Páginas",
    tool_organize_pdf_desc: "Reordena, elimina o rota páginas a 90°, 180° o 270° en cualquier archivo PDF.",
    tool_watermark_pdf_name: "Marca de Agua en PDF",
    tool_watermark_pdf_desc: "Protege los derechos de autor aplicando marcas de agua de texto o logotipo personalizadas.",
    tool_lock_pdf_name: "Proteger y Bloquear PDF",
    tool_lock_pdf_desc: "Cifra documentos PDF con una contraseña segura para evitar accesos no autorizados.",
    tool_unlock_pdf_name: "Desbloquear PDF",
    tool_unlock_pdf_desc: "Elimina la protección por contraseña y las restricciones de archivos PDF seguros.",
    tool_pdf_to_word_name: "PDF a Word",
    tool_pdf_to_word_desc: "Convierte archivos PDF en documentos de Microsoft Word totalmente editables (.docx o .doc).",
    tool_word_to_pdf_name: "Word a PDF",
    tool_word_to_pdf_desc: "Convierte documentos de Word (.docx, .doc, .rtf, .odt) en archivos PDF profesionales estándar.",
    tool_pdf_to_excel_name: "PDF a Excel",
    tool_pdf_to_excel_desc: "Extrae tablas y datos estructurados de PDF a hojas de cálculo editables en XLSX o CSV.",
    tool_excel_to_pdf_name: "Excel a PDF",
    tool_excel_to_pdf_desc: "Convierte hojas de cálculo de Excel (.xlsx, .xls, .csv) en documentos PDF limpios.",
    tool_pdf_to_image_name: "PDF a Imagen",
    tool_pdf_to_image_desc: "Convierte páginas de documentos PDF en imágenes de alta resolución JPG, PNG o WEBP.",
    tool_image_to_pdf_name: "Imagen a PDF",
    tool_image_to_pdf_desc: "Convierte fotos, escaneos e imágenes gráficas (JPG, PNG, WEBP) en un PDF impecable.",
    tool_image_converter_name: "Convertidor de Imágenes",
    tool_image_converter_desc: "Convierte entre formatos de imagen (PNG, JPG, WEBP, AVIF, BMP) sin pérdida de calidad.",
    tool_image_compressor_name: "Compresor de Imágenes",
    tool_image_compressor_desc: "Comprime imágenes JPG, PNG y WEBP para una carga web más rápida.",
    tool_image_resizer_name: "Redimensionar Imagen",
    tool_image_resizer_desc: "Cambia las dimensiones en píxeles, la relación de aspecto o recorta imágenes con vista previa.",
    tool_edit_word_name: "Editor y Visor de Word",
    tool_edit_word_desc: "Abre, lee, modifica contenido de texto y exporta documentos de Microsoft Word.",
    tool_word_to_txt_name: "Word a Texto Plano",
    tool_word_to_txt_desc: "Extrae el texto sin formato y párrafos de documentos de Word.",
    tool_edit_excel_name: "Editor de Hojas Excel",
    tool_edit_excel_desc: "Visualiza, edita celdas, calcula totales y modifica hojas XLSX y CSV.",
    tool_csv_excel_converter_name: "Convertidor CSV ↔ Excel",
    tool_csv_excel_converter_desc: "Convierte archivos de datos CSV en libros de trabajo XLSX formateados y viceversa.",
    tool_ppt_to_pdf_name: "PowerPoint a PDF",
    tool_ppt_to_pdf_desc: "Convierte diapositivas de presentación PPTX en páginas PDF de alta resolución.",
    tool_ocr_reader_name: "Extractor de Texto OCR",
    tool_ocr_reader_desc: "Extrae texto de documentos PDF escaneados, facturas, recibos e imágenes.",
    tool_universal_converter_name: "Convertidor Universal por Lotes",
    tool_universal_converter_desc: "Sube múltiples archivos de cualquier formato admitido y conviértelos o comprímelos a granel."
  },
  fr: {
    // Header & Nav
    searchPlaceholder: "Rechercher des outils (ex. 'Fusionner PDF', 'Compresser Word', 'OCR')",
    allTools: "Tous les Outils",
    compress: "Compresser",
    convert: "Convertir",
    recent: "Récents",
    recentlyUsed: "Utilisés Récemment",
    freeForever: "Gratuit Toujours",
    admin: "Admin",
    share: "Partager",
    shareTitle: "Partager cette page ou outil",
    linkCopied: "Lien copié !",
    selectLanguage: "Langue",
    toggleTheme: "Changer de Thème",
    noRecentTools: "Aucun outil récent.",

    // Hero Drag & Drop
    heroTitle: "Glissez et Déposez Vos Fichiers Ici",
    heroSub: "PDF, Word, Excel, JPG, PNG, et plus (Max 1 Go) • Aucune Inscription Requise",
    autoDetect: "Détection Automatique",

    // Sidebar
    categories: "Catégories",
    privacyPromiseTitle: "Garantie de Confidentialité :",
    privacyPromiseDesc: "Tous les fichiers sont traités localement ou supprimés instantanément après le téléchargement.",

    // Categories
    cat_All: "Tous",
    cat_PDF_Tools: "Outils PDF",
    cat_Word_Tools: "Outils Word",
    cat_Excel_Tools: "Outils Excel",
    cat_PowerPoint_Tools: "Outils PowerPoint",
    cat_Image_Tools: "Outils Image",
    cat_Compression_Tools: "Outils de Compression",
    cat_Conversion_Tools: "Outils de Conversion",

    // Tool Card & Grid
    allAvailableTools: "Tous les Outils Disponibles",
    openTool: "Ouvrir →",
    popularBadge: "Populaire",
    newBadge: "Nouveau",
    proBadge: "Pro",
    freeBadge: "Gratuit",
    batchBadge: "Lot",
    noToolsMatch: "Aucun outil ne correspond à votre recherche",
    trySearching: 'Essayez de chercher des termes comme "PDF", "Compresser", "Word" ou "Convertir".',
    showAllTools: "Afficher Tous les Outils",
    searchResultPrefix: "Recherche :",

    // Footer Features
    feat_noAccountTitle: "Aucun Compte Requis",
    feat_noAccountDesc: "Zéro inscription requise. Utilisez tous les outils PDF, Word, Excel et Image instantanément.",
    feat_secureTitle: "100% Sécurisé & Privé",
    feat_secureDesc: "Les fichiers sont traités dans la mémoire de votre navigateur ou supprimés automatiquement.",
    feat_adsenseTitle: "Conforme à Google AdSense",
    feat_adsenseDesc: "Conçu selon les politiques de Google avec des conditions de confidentialité transparentes.",
    feat_batchTitle: "Traitement par Lots",
    feat_batchDesc: "Convertissez, compressez et fusionnez plusieurs documents simultanément avec téléchargement ZIP instantané.",

    // Footer Sections
    footerBrandDesc: "La suite en ligne de référence pour des conversions de fichiers rapides et sécurisées, l'édition de PDF, la compression et la retouche d'images.",
    footerTrademarks: "Toutes les marques et logos mentionnés sont la propriété de leurs détenteurs respectifs.",
    popularToolsTitle: "Outils Populaires",
    categoriesTitle: "Catégories",
    legalPolicyTitle: "Légal & Politiques",
    knowledgeHelpTitle: "Centre d'Aide & Guides",
    privacyPolicy: "Politique de Confidentialité",
    termsConditions: "Conditions Générales",
    disclaimer: "Clause de Non-responsabilité",
    aboutUs: "À Propos de Nous",
    blogKnowledge: "Blog & Guides",
    faqHelp: "Foire Aux Questions",
    contactSupport: "Contact & Support",
    copyrightText: "pdfeditfy.com. Tous droits réservés. Station de travail documentaire gratuite.",

    // Cookie Banner
    cookieTitle: "Préférences de Confidentialité & Cookies",
    cookieText: "pdfeditfy.com utilise le stockage local et des cookies Google AdSense pour personnaliser les annonces et analyser le trafic de manière anonyme.",
    acceptAll: "Tout Accepter & Continuer",
    essentialOnly: "Essentiels Uniquement",
    viewPrivacy: "Politique de Confidentialité",

    // Tool Names & Descriptions
    tool_edit_pdf_name: "Éditer un PDF",
    tool_edit_pdf_desc: "Ajoutez du texte, des images, des formes, surlignez et signez directement sur votre PDF.",
    tool_merge_pdf_name: "Fusionner des PDF",
    tool_merge_pdf_desc: "Combinez plusieurs fichiers PDF en un seul document organisé en quelques secondes.",
    tool_split_pdf_name: "Diviser un PDF",
    tool_split_pdf_desc: "Extrayez des pages spécifiques ou divisez un PDF volumineux en plusieurs fichiers.",
    tool_compress_pdf_name: "Compresser un PDF",
    tool_compress_pdf_desc: "Réduisez considérablement la taille du fichier PDF tout en préservant la qualité.",
    tool_organize_pdf_name: "Réorganiser & Faire Pivoter",
    tool_organize_pdf_desc: "Réorganisez, supprimez ou faites pivoter les pages à 90°, 180° ou 270°.",
    tool_watermark_pdf_name: "Filigrane PDF",
    tool_watermark_pdf_desc: "Protégez vos droits d'auteur en appliquant des filigranes de texte ou de logo personnalisés.",
    tool_lock_pdf_name: "Protéger & Verrouiller un PDF",
    tool_lock_pdf_desc: "Chiffrez vos documents PDF avec un mot de passe sécurisé pour empêcher tout accès non autorisé.",
    tool_unlock_pdf_name: "Déverrouiller un PDF",
    tool_unlock_pdf_desc: "Supprimez la protection par mot de passe des fichiers PDF sécurisés.",
    tool_pdf_to_word_name: "PDF en Word",
    tool_pdf_to_word_desc: "Convertissez des PDF en documents Microsoft Word (.docx ou .doc) entièrement modifiables.",
    tool_word_to_pdf_name: "Word en PDF",
    tool_word_to_pdf_desc: "Convertissez des documents Word (.docx, .doc, .rtf, .odt) en fichiers PDF professionnels.",
    tool_pdf_to_excel_name: "PDF en Excel",
    tool_pdf_to_excel_desc: "Extrayez des tableaux et données de PDF en feuilles de calcul éditables XLSX ou CSV.",
    tool_excel_to_pdf_name: "Excel en PDF",
    tool_excel_to_pdf_desc: "Convertissez des feuilles de calcul Excel (.xlsx, .xls, .csv) en documents PDF propres.",
    tool_pdf_to_image_name: "PDF en Image",
    tool_pdf_to_image_desc: "Convertissez des pages PDF en images haute résolution JPG, PNG ou WEBP.",
    tool_image_to_pdf_name: "Image en PDF",
    tool_image_to_pdf_desc: "Transformez des photos et scans (JPG, PNG, WEBP) en un fichier PDF impeccable.",
    tool_image_converter_name: "Convertisseur d'Images",
    tool_image_converter_desc: "Convertissez entre formats d'images (PNG, JPG, WEBP, AVIF, BMP) sans perte de qualité.",
    tool_image_compressor_name: "Compresseur d'Images",
    tool_image_compressor_desc: "Compressez les images JPG, PNG et WEBP pour un chargement web accéléré.",
    tool_image_resizer_name: "Redimensionner une Image",
    tool_image_resizer_desc: "Modifiez les dimensions en pixels, le ratio ou recadrez vos images en direct.",
    tool_edit_word_name: "Éditeur & Visionneur Word",
    tool_edit_word_desc: "Ouvrez, lisez, modifiez et exportez des documents Microsoft Word.",
    tool_word_to_txt_name: "Word en Texte Brut",
    tool_word_to_txt_desc: "Extrayez le contenu textuel brut des documents Word.",
    tool_edit_excel_name: "Éditeur de Tableur Excel",
    tool_edit_excel_desc: "Consultez, modifiez des cellules, calculez des totaux et éditez des feuilles XLSX/CSV.",
    tool_csv_excel_converter_name: "Convertisseur CSV ↔ Excel",
    tool_csv_excel_converter_desc: "Convertissez des fichiers de données CSV en classeurs XLSX et vice versa.",
    tool_ppt_to_pdf_name: "PowerPoint en PDF",
    tool_ppt_to_pdf_desc: "Convertissez des diapositives de présentation PPTX en pages PDF haute définition.",
    tool_ocr_reader_name: "Extracteur de Texte OCR",
    tool_ocr_reader_desc: "Extrayez le texte de documents PDF numérisés, factures, reçus et images.",
    tool_universal_converter_name: "Convertisseur Universel par Lots",
    tool_universal_converter_desc: "Téléversez plusieurs fichiers de n'importe quel format et traitez-les en masse."
  },
  de: {
    // Header & Nav
    searchPlaceholder: "Werkzeuge suchen (z.B. 'PDF zusammenfügen', 'Word komprimieren', 'OCR')",
    allTools: "Alle Werkzeuge",
    compress: "Komprimieren",
    convert: "Konvertieren",
    recent: "Zuletzt",
    recentlyUsed: "Zuletzt Verwendet",
    freeForever: "Kostenlos Für Immer",
    admin: "Admin",
    share: "Teilen",
    shareTitle: "Diese Seite oder dieses Werkzeug teilen",
    linkCopied: "Link kopiert!",
    selectLanguage: "Sprache",
    toggleTheme: "Design Wechseln",
    noRecentTools: "Noch keine zuletzt verwendeten Werkzeuge.",

    // Hero Drag & Drop
    heroTitle: "Dateien Hier Hineinziehen & Ablegen",
    heroSub: "PDF, Word, Excel, JPG, PNG und mehr (Max 1GB) • Keine Registrierung Erforderlich",
    autoDetect: "Automatische Erkennung",

    // Sidebar
    categories: "Kategorien",
    privacyPromiseTitle: "Datenschutz-Versprechen:",
    privacyPromiseDesc: "Alle Dateien werden lokal verarbeitet oder sofort nach dem Herunterladen gelöscht.",

    // Categories
    cat_All: "Alle",
    cat_PDF_Tools: "PDF-Werkzeuge",
    cat_Word_Tools: "Word-Werkzeuge",
    cat_Excel_Tools: "Excel-Werkzeuge",
    cat_PowerPoint_Tools: "PowerPoint-Werkzeuge",
    cat_Image_Tools: "Bild-Werkzeuge",
    cat_Compression_Tools: "Komprimierungs-Werkzeuge",
    cat_Conversion_Tools: "Konvertierungs-Werkzeuge",

    // Tool Card & Grid
    allAvailableTools: "Alle Verfügbaren Werkzeuge",
    openTool: "Öffnen →",
    popularBadge: "Beliebt",
    newBadge: "Neu",
    proBadge: "Pro",
    freeBadge: "Kostenlos",
    batchBadge: "Stapel",
    noToolsMatch: "Keine Werkzeuge entsprechen Ihrer Suche",
    trySearching: 'Versuchen Sie Begriffe wie "PDF", "Komprimieren", "Word" oder "Konvertieren".',
    showAllTools: "Alle Werkzeuge Anzeigen",
    searchResultPrefix: "Suche:",

    // Footer Features
    feat_noAccountTitle: "Kein Konto Erforderlich",
    feat_noAccountDesc: "Keine Anmeldung erforderlich. Nutzen Sie alle PDF-, Word-, Excel- und Bildwerkzeuge sofort.",
    feat_secureTitle: "100% Sicher & Privat",
    feat_secureDesc: "Dateien werden direkt im Browserspeicher verarbeitet oder automatisch gelöscht.",
    feat_adsenseTitle: "AdSense-Konform",
    feat_adsenseDesc: "Entwickelt nach den Qualitätsrichtlinien von Google mit transparenten Datenschutzbestimmungen.",
    feat_batchTitle: "Stapelverarbeitung",
    feat_batchDesc: "Mehrere Dokumente gleichzeitig konvertieren, komprimieren und zusammenfügen mit ZIP-Download.",

    // Footer Sections
    footerBrandDesc: "Die führende Online-Suite für schnelle und sichere Dateikonvertierungen, PDF-Bearbeitung, Komprimierung und Bildbearbeitung.",
    footerTrademarks: "Alle erwähnten Marken und Produktnamen sind Eigentum ihrer jeweiligen Inhaber.",
    popularToolsTitle: "Beliebte Werkzeuge",
    categoriesTitle: "Kategorien",
    legalPolicyTitle: "Rechtliches & Richtlinien",
    knowledgeHelpTitle: "Hilfe & Anleitungen",
    privacyPolicy: "Datenschutz-Bestimmungen",
    termsConditions: "Allgemeine Geschäftsbedingungen",
    disclaimer: "Haftungsausschluss",
    aboutUs: "Über Uns",
    blogKnowledge: "Blog & Anleitungen",
    faqHelp: "Häufige Fragen (FAQ)",
    contactSupport: "Kontakt & Support",
    copyrightText: "pdfeditfy.com. Alle Rechte vorbehalten. Kostenlose Dokumenten-Workstation.",

    // Cookie Banner
    cookieTitle: "Datenschutz- & Cookie-Einstellungen",
    cookieText: "pdfeditfy.com verwendet lokalen Browserspeicher und Google AdSense-Cookies zur Personalisierung und anonymen Nutzungsanalyse.",
    acceptAll: "Alle Akzeptieren & Fortfahren",
    essentialOnly: "Nur Notwendige",
    viewPrivacy: "Datenschutz-Bestimmungen",

    // Tool Names & Descriptions
    tool_edit_pdf_name: "PDF Bearbeiten",
    tool_edit_pdf_desc: "Fügen Sie Text, Bilder, Formen hinzu, markieren Sie Text und unterschreiben Sie direkt in Ihrem PDF-Dokument.",
    tool_merge_pdf_name: "PDF Zusammenfügen",
    tool_merge_pdf_desc: "Kombinieren Sie mehrere PDF-Dateien in Sekundenschnelle zu einem einzigen organisierten Dokument.",
    tool_split_pdf_name: "PDF Teilen",
    tool_split_pdf_desc: "Extrahieren Sie bestimmte Seiten oder teilen Sie ein großes PDF in kleinere Dokumente auf.",
    tool_compress_pdf_name: "PDF Komprimieren",
    tool_compress_pdf_desc: "Reduzieren Sie die PDF-Dateigröße erheblich bei maximaler visueller Dokumentqualität.",
    tool_organize_pdf_name: "Seiten Neu Anordnen & Drehen",
    tool_organize_pdf_desc: "Seiten in jeder PDF-Datei umordnen, löschen oder um 90°, 180° oder 270° drehen.",
    tool_watermark_pdf_name: "PDF-Wasserzeichen",
    tool_watermark_pdf_desc: "Schützen Sie Urheberrechte durch Hinzufügen von individuellem Text oder Logo-Wasserzeichen.",
    tool_lock_pdf_name: "PDF Schützen & Sperren",
    tool_lock_pdf_desc: "Verschlüsseln Sie PDF-Dokumente mit einem sicheren Passwort gegen unbefugten Zugriff.",
    tool_unlock_pdf_name: "PDF Entsperren",
    tool_unlock_pdf_desc: "Entfernen Sie Passwortschutz und Einschränkungen von gesicherten PDF-Dateien.",
    tool_pdf_to_word_name: "PDF in Word",
    tool_pdf_to_word_desc: "Konvertieren Sie PDF-Dateien in vollständig bearbeitbare Microsoft Word-Dokumente (.docx/.doc).",
    tool_word_to_pdf_name: "Word in PDF",
    tool_word_to_pdf_desc: "Konvertieren Sie Word-Dokumente (.docx, .doc, .rtf, .odt) in professionelle PDF-Dateien.",
    tool_pdf_to_excel_name: "PDF in Excel",
    tool_pdf_to_excel_desc: "Extrahieren Sie Tabellen und strukturierte Daten aus PDFs in bearbeitbare XLSX/CSV-Tabellen.",
    tool_excel_to_pdf_name: "Excel in PDF",
    tool_excel_to_pdf_desc: "Konvertieren Sie Excel-Tabellen (.xlsx, .xls, .csv) in saubere PDF-Dokumente.",
    tool_pdf_to_image_name: "PDF in Bild",
    tool_pdf_to_image_desc: "Konvertieren Sie PDF-Seiten in hochauflösende JPG-, PNG- oder WEBP-Bilder.",
    tool_image_to_pdf_name: "Bild in PDF",
    tool_image_to_pdf_desc: "Verwandeln Sie Fotos, Scans und Grafiken (JPG, PNG, WEBP) in ein sauberes PDF.",
    tool_image_converter_name: "Bild-Konverter",
    tool_image_converter_desc: "Konvertieren Sie zwischen Bildformaten (PNG, JPG, WEBP, AVIF, BMP) ohne Qualitätsverlust.",
    tool_image_compressor_name: "Bild-Kompressor",
    tool_image_compressor_desc: "Komprimieren Sie JPG-, PNG- und WEBP-Bilder für schnellere Ladezeiten im Web.",
    tool_image_resizer_name: "Bildgröße Ändern",
    tool_image_resizer_desc: "Ändern Sie Pixelabmessungen, Seitenverhältnisse oder schneiden Sie Bilder mit Live-Vorschau zu.",
    tool_edit_word_name: "Word-Editor & Betrachter",
    tool_edit_word_desc: "Öffnen, lesen und bearbeiten Sie Textinhalte und exportieren Sie Microsoft Word-Dokumente.",
    tool_word_to_txt_name: "Word in Reinen Text",
    tool_word_to_txt_desc: "Extrahieren Sie reinen Text und Absätze aus Word-Dokumenten.",
    tool_edit_excel_name: "Excel-Tabellen-Editor",
    tool_edit_excel_desc: "Zelldaten anzeigen, bearbeiten, Summen berechnen und XLSX/CSV-Tabellen anpassen.",
    tool_csv_excel_converter_name: "CSV ↔ Excel Konverter",
    tool_csv_excel_converter_desc: "Konvertieren Sie CSV-Dateien in formatierte XLSX-Arbeitsmappen und umgekehrt.",
    tool_ppt_to_pdf_name: "PowerPoint in PDF",
    tool_ppt_to_pdf_desc: "Konvertieren Sie PPTX-Präsentationsfolien in hochauflösende PDF-Seiten.",
    tool_ocr_reader_name: "OCR-Textextraktor",
    tool_ocr_reader_desc: "Extrahieren Sie Text aus gescannten PDF-Dokumenten, Rechnungen, Quittungen und Bildern.",
    tool_universal_converter_name: "Universeller Stapelkonverter",
    tool_universal_converter_desc: "Laden Sie mehrere Dateien beliebiger unterstützter Formate hoch und verarbeiten Sie diese im Stapel."
  }
};

/**
 * Universal translation helper that safely resolves keys, category names, and tool titles
 */
export function getTranslation(key: string, lang: LanguageCode = 'en', fallback?: string): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  if (dict[key]) return dict[key];
  if (TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
  return fallback || key;
}

export function translateCategory(category: string, lang: LanguageCode = 'en'): string {
  const catKey = 'cat_' + category.replace(/\s+/g, '_');
  return getTranslation(catKey, lang, category);
}

export function translateToolName(toolId: string, defaultName: string, lang: LanguageCode = 'en'): string {
  const toolKey = 'tool_' + toolId.replace(/-/g, '_') + '_name';
  return getTranslation(toolKey, lang, defaultName);
}

export function translateToolDescription(toolId: string, defaultDesc: string, lang: LanguageCode = 'en'): string {
  const toolKey = 'tool_' + toolId.replace(/-/g, '_') + '_desc';
  return getTranslation(toolKey, lang, defaultDesc);
}
