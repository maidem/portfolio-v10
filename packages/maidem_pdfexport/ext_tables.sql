# Custom columns added to tt_content for the maidem_pdfexport CType
CREATE TABLE tt_content (
    maidem_pdfexport_info_label varchar(255) DEFAULT 'Vitals' NOT NULL,
    maidem_pdfexport_tech_label varchar(255) DEFAULT 'Stack' NOT NULL,
    maidem_pdfexport_tech_title varchar(255) DEFAULT 'Skills' NOT NULL,
    maidem_pdfexport_projects_label varchar(255) DEFAULT 'Projekte' NOT NULL,
    maidem_pdfexport_logbook_label varchar(255) DEFAULT 'Logbuch' NOT NULL
);
