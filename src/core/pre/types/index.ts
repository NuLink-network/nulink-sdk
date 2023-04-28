//format
export enum FileType {
  Text, //Includes text files, ebook files, compressed files
  Data, //Including data files
  Video,
  Audio,
  Image, //Includes 3D image files, bitmap files, vector files
  Executable, //executable file
  Other,
}

//type
export enum FileCategory {
  unkown,
  Philosophy, 
  Religion, 
  Ethics, 
  Logic, 
  Aesthetics,
  Psychology, 
  Language, 
  Literature, 
  Art,
  Political, 
  Economic,
  Military, 
  Law, 
  Education, 
  Sports, 
  Media,
  Information, 
  Management, 
  Business, 
  History,
  Archaeological,
  Nation,
  Life,
  Financial, 
  Statistics,
  Social,
  Music,
  Technology, 
  Pet,
}



//The format mapping to suffix
export const  FileType2Suffix = {
  Text : ["ADOC", "ANS", "APKG", "ASC", "ASS", "BBL", "BIB", "BIBTEX", "CSK", "CSV", "DES", "DOC", "DOCM", "DOCX", "FDF", "FDX", "FDXT", "HWP", "INFO", "LOG", "LST", "LTX", "MARKDN", "MARKDOWN", "MBOX", "MD", "MDOWN", "MSG", "NFO", "ODM", "ODT", "OTT", "PAGES", "PSB", "RTF", "SMI", "SRT", "SSA", "STRINGS", "SXW", "TEX", "TXT", "VMG", "VNT", "WP5", "WPD", "WPS", "WPS", "WRI", "XFDF","ACSM", "APNX", "AZW", "AZW1", "AZW3", "CB7", "CBA", "CBR", "CBT", "CBZ", "CEB", "CEBX", "CHM", "EPUB", "FB2", "IBOOKS", "LIT", "MOBI", "PDG", "SNB", "TEB", "TPZ", "UMD","PDF","1", "7Z", "ACE", "ALZ", "ARC", "ARJ", "B1", "BR", "BZ", "BZ2", "BZIP", "BZIP2", "CAB", "CB7", "CBR", "CBT", "CBZ", "CPGZ", "CPIO", "DD", "DEB", "EDXZ", "EGG", "EMZ", "ENLX", "GZ", "GZIP", "HQX", "ISZ", "JAR", "KZ", "LHA", "LZ", "LZ4", "LZH", "LZMA", "LZO", "MPQ", "PAK", "PEA", "PET", "PKG", "PUP", "R00", "R01", "R02", "R03", "R04", "R05", "RAR", "RPM", "SHAR", "SHR", "SIT", "SITX", "TAR", "TAR", "BZ2", "TAR", "GZ", "TAR", "LZ", "TAR", "LZMA", "TAR", "XZ", "TAR", "Z", "TAZ", "TB2", "TBZ", "TBZ2", "TGZ", "TLZ", "TLZMA", "TPZ", "TXZ", "TZ", "UUE", "WHL", "XAR", "XIP", "XZ", "Z", "ZIP", "ZIPX"],
  Data: ["AAE", "ACA", "ADT", "AIFB", "APPROJ", "BDIC", "BIN", "BLG", "CERT", "CRTX", "CSV", "DAT", "DATA", "DCR", "DDB", "DEF", "DIF", "DPS", "DSL", "DTP", "EFX", "EM", "ENL", "ENLX", "ENW", "FCPEVENT", "FLIPCHART", "FLO", "FLO", "FLP", "FRM", "GAN", "GCW", "GED", "GEDCOM", "GMS", "GRD", "H4", "H5", "HDF", "HDF4", "HDF5", "HE4", "HE5", "HSC", "IDX", "JMS", "JPR", "JSON", "KEY", "LD2", "LIB", "LSD", "M", "MARC", "MBX", "MDX", "MM", "MMF", "MPP", "MTB", "NOTEBOOK", "OBB", "ODF", "ODP", "OFX", "OTP", "OVA", "OVF", "PDB", "PES", "PPS", "PPSM", "PPSX"],
  Video: ["264", "3G2", "3GP", "3GP2", "3GPP", "3GPP2", "AAF", "AEP", "AEPX", "AET", "AETX", "AMV", "ARF", "ASF", "ASX", "AVI", "BIK", "CAMPROJ", "CAMREC", "CED", "CMPROJ", "CMREC", "CSF", "DAT", "DIVX", "DV", "DZM", "F4P", "F4V", "FLA", "FLC", "FLH", "FLI", "FLIC", "FLP", "FLV", "FLX", "H264", "IFF", "IFO", "ISMC", "ISMV", "M1V", "M2P", "M2T", "M2TS", "M2V", "M4V", "MK3D", "MKS", "MKV", "MOV", "MP2V", "MP4", "MP4V", "MPE", "MPEG", "MPEG1", "MPEG2", "MPEG4", "MPG", "MPV", "MPV2", "MSWMM", "MT2S", "MTS", "NUT", "OGM", "OGX", "OVG", "PDS", "QLV", "QMV", "QSV", "QT", "R3D", "RAM", "RM", "RMD", "RMHD", "RMM", "RMVB", "RP", "RV", "SRT", "STL", "SWF", "TREC", "TS", "USF", "VOB", "VRO", "VTT", "WEBM", "WMMP"],
  Audio: ["3GA", "AA", "AAC", "AAX", "AC3", "ACT", "ADPCM", "ADT", "ADTS", "AIF", "AIFC", "AIFF", "ALAC", "AMR", "APE", "ASD", "AU", "AU", "AUP", "AUP3", "CAF", "CDA", "CDR", "DTS", "DVF", "F4A", "FLAC", "GPX", "GSM", "ISMA", "M1A", "M2A", "M3U", "M3U8", "M4A", "M4B", "M4P", "M4R", "MID", "MIDI", "MKA", "MMF", "MP1", "MP2", "MP3", "MPA", "MPC", "MPG2", "MUI", "NSF", "OGA", "OGG", "OMA", "OPUS", "PTB", "PTX", "PTXT", "RA", "RAW", "RMI", "SID", "WAV", "WMA", "WPL", "WVE", "XMF", "XSPF"],
  Image: ["3DL", "3DM", "3DS", "ABC", "ASM", "BIP", "BLEND", "BVH", "C4D", "CG", "CMF", "CSM", "DAE", "EGG", "FBX", "GLB", "GLTF", "IGS", "LDR", "LXF", "MA", "MAX", "MB", "MIX", "MTL", "OBJ", "PCD", "PLY", "PMD", "R3D", "SKP", "SRF", "STEP", "STP", "U3D", "VOB", "XAF", "APNG", "ART", "AVIF", "BMP", "CUR", "DCM", "DDS", "DIC", "DICOM", "DJVU", "FITS", "FLIF", "FPX", "FRM", "FTS", "GBR", "GIF", "HDP", "HDR", "HEIC", "HEIF", "ICN", "ICNS", "ICO", "ICON", "IFF", "IMG", "ITHMB", "J2C", "J2K", "JFIF", "JP2", "JPC", "JPEG", "JPF", "JPG", "JPX", "JXR", "MAC", "MNG", "PAM", "PBM", "PCD", "PCT", "PCX", "PDD", "PGF", "PGM", "PIC", "PICT", "PICTCLIPPING", "PJP", "PJPEG", "PJPG", "PNG", "PNM", "PPM", "PSB", "PSD", "PSP", "PSPIMAGE", "SFW", "TBI", "TGA", "THM", "THM", "TIF", "TIFF", "VST", "WBMP", "WDP", "WEBP", "XBM", "XCF", "AI", "ART", "CDR", "CDT", "CGM", "CVS", "EMF", "EMZ", "EPS", "EPSF", "EPSI", "FXG", "GVDESIGN", "ODG", "OTG", "PIC", "PS", "SKETCH", "STD", "SVG", "SVGZ", "VDX", "VSD", "VSDM", "VSDX", "VSS", "VST", "VSX", "WMF", "WMZ", "WPG", "XAR"],
  Executable: ["AAB", "AIR", "APK", "APP", "APPX", "BAT", "CGI", "CMD", "COM", "DEX", "DMG", "DS", "DSA", "EX4", "EX5", "EXE", "GADGET", "GPK", "JAR", "JS", "JSF", "MSIX", "NEXE", "PKG", "RUN", "SCR", "UDF", "VB", "VBS", "WSF", "XAP", "XAPK", "XBE", "XEX"],
  Other: "All other formats are included", //Including all
}

export type FileInfo = {
    name: string;
    fileBinaryArrayBuffer: ArrayBuffer, //The binary representation of the contents of files By invoke 'FileReader.ReadAsArrayBuffer(file)' callback return the value: e.target.result
    fileCategory?: FileCategory | string;
  };