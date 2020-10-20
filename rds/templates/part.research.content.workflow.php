<h2 class="app-name"><?php p($l->t('Project')); ?> {{ inc research.researchIndex }}</h2>

<p class="section-text">
  <h1><?php p($l->t('Here you can enter all informations about your research synchronization.')); ?>
</p>

<div class="wrapper-services">
  <p class="section-service">
    <?php p($l->t('Please select a folder where you want to take your files from.')); ?>
  </p>
  <div class="fileStorage-wrapper">
    <label><button id="btn-open-folderpicker" data-service="Owncloud"><?php p($l->t('Select folder')); ?></button>
      <span id="filepath">
        {{#if filepath }}
        <?php p($l->t('Current path:')); ?>
        <span id="fileStorage-path-Owncloud">{{filepath}}</span>
        {{else}}
          <?php p($l->t('No path currently selected.')); ?>
        {{/if}}
      </span>
    </label>
  </div>

  <?php p($l->t('Please select all services, which you want to use for your synchronization.')); ?>
  <div class="metadata-wrapper">
    {{#each services}}
      <div class="metadata-service">
        <label>
          <input type="checkbox" name="checkbox-{{ servicename }}-property" id="checkbox-{{ servicename }}-metadata" data-value="metadata" data-service="{{ servicename }}" {{#if projectId}} data-projectid="{{ projectId }}" {{/if}} {{ metadataChecked }} />
          {{ servicename }}
        </label>
      </div>
    {{/each}}
  </div>
</div>

<div class="wrapper-custom-buttons">
  <div class="spacer"></div>
  <button id="btn-save-research"><?php p($l->t('Save')); ?></button>
  <button id="btn-save-research-and-continue"><?php p($l->t('Save & synchronize')); ?></button>
</div>