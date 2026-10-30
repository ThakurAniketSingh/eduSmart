package com.edusmart.dto;

import jakarta.validation.constraints.NotNull;

public class UpdatePermissionsRequest {
    
    private Boolean canDraw;
    
    private Boolean canCreateFile;
    
    private Boolean canEditFile;
    
    private Boolean canDeleteFile;

    public UpdatePermissionsRequest() {}

    public UpdatePermissionsRequest(Boolean canDraw, Boolean canCreateFile, Boolean canEditFile, Boolean canDeleteFile) {
        this.canDraw = canDraw;
        this.canCreateFile = canCreateFile;
        this.canEditFile = canEditFile;
        this.canDeleteFile = canDeleteFile;
    }

    public Boolean isCanDraw() { return canDraw; }
    public void setCanDraw(Boolean canDraw) { this.canDraw = canDraw; }

    public Boolean isCanCreateFile() { return canCreateFile; }
    public void setCanCreateFile(Boolean canCreateFile) { this.canCreateFile = canCreateFile; }

    public Boolean isCanEditFile() { return canEditFile; }
    public void setCanEditFile(Boolean canEditFile) { this.canEditFile = canEditFile; }

    public Boolean isCanDeleteFile() { return canDeleteFile; }
    public void setCanDeleteFile(Boolean canDeleteFile) { this.canDeleteFile = canDeleteFile; }
}
