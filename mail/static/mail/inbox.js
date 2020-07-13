document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', load_compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

/* --------------------------------------------------------------------------------- */
/*CONNECT TO DATABASE*/
/* --------------------------------------------------------------------------------- */

function send_mail(){
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  return fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
}

function get_mail(mailbox){
  return fetch(`/emails/${mailbox}`)
  .then(response => response.json());
}

function get_unique_email(email_id){
  return fetch(`/emails/${email_id}`)
  .then(response => response.json())
}

function read_update(email_id, status){
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: status
    })
  })
}

async function archive_update(email_id, status){
  var init = await fetch(`/emails/${email_id}`, {method: 'PUT', body: JSON.stringify({ archived: status })}); 
  return init
}

/* --------------------------------------------------------------------------------- */
/*CONNECT TO DATABASE*/
/* --------------------------------------------------------------------------------- */

/* --------------------------------------------------------------------------------- */
/*SHOW RESULTS TO THE USER*/
/* --------------------------------------------------------------------------------- */

function load_compose_email() {

  // Show compose view and hide other views
  document.querySelector('#email-page-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#compose-submit').addEventListener('click', () => {
    send_mail().then(result => {
      console.log(result);
      load_mailbox('inbox');
      if(result.error){
        show_message(result.error, document.querySelector('#emails-view'));
      }else{
        show_message(result.message, document.querySelector('#emails-view'));
      }   
    });
  });
}

function load_mailbox(mailbox) {
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //Get mails
  get_mail(mailbox).then(result => {
    result.forEach(email => {
      console.log(email);

      //Create Row
      emailRow = document.createElement('div');
      if(email.read){
        emailRow.className = 'row p-3 bg-light mb-1';
      }else{
        emailRow.className = 'row p-3 bg-white mb-1';
      }
      
      //Create Cols
      senderCol = document.createElement('div');
      subjectCol = document.createElement('div');
      timestampCol = document.createElement('div');

      //Add classes to cols
      senderCol.className = 'col-2';
      subjectCol.className = 'col';
      timestampCol.className = 'col-2 text-right';

      //Add content to cols
      senderCol.innerHTML = email.sender;
      subjectCol.innerHTML = email.subject;
      timestampCol.innerHTML = email.timestamp;

      //Append Cols to Row
      cols = [senderCol, subjectCol, timestampCol];
      for(i=0; i<cols.length; i++){
        emailRow.append(cols[i])
      }

      emailRow.addEventListener('click', () => load_email_page(email.id)); 

      //Append row to mailbox
      document.querySelector('#emails-view').append(emailRow);
    });
  });
  
  // Show the mailbox and hide other views
  document.querySelector('#email-page-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
}

function load_email_page(email_id){
  get_unique_email(email_id).then(email => {
    document.querySelector('#email-sender').innerHTML = `Sender: ${email.sender}`;
    document.querySelector('#email-recipients').innerHTML = `Recipients: ${email.recipients}`;
    document.querySelector('#email-timestamp').innerHTML = `Timestamp: ${email.timestamp}`;
    document.querySelector('#email-subject').innerHTML = `Subject: ${email.subject}`;
    document.querySelector('#email-body').innerHTML = email.body;
  
    read_update(email_id, true);

    const archiveButton = document.querySelector('#archive-button');
    if(email.archived){
      archiveButton.innerHTML = 'Unarchive';
      archiveButton.addEventListener('click', () => {
        archive_update(email_id, false);
        document.location.reload(true);
      });
    }else{
      archiveButton.innerHTML = 'Archive';
      archiveButton.addEventListener('click', () => {
        archive_update(email_id, true);
        document.location.reload(true);
      });
    }

    const replyButton = document.querySelector('#reply-button');
    replyButton.addEventListener('click', () => reply_email(email_id))
  })

  // Show the email page and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-page-view').style.display = 'block';
}

function reply_email(email_id){
  load_compose_email();
  get_unique_email(email_id).then(email => {
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
  });
}

function show_message(message, page){
  //Create Message Div
  messageDiv = document.createElement('div');
  messageDiv.className = 'alert alert-warning';
  messageDiv.innerHTML = message;

  //Append Message to Page
  page.append(messageDiv);
}

/* --------------------------------------------------------------------------------- */
/*SHOW RESULTS TO THE USER*/
/* --------------------------------------------------------------------------------- */