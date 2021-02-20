#!/usr/bin/perl -wT
use CGI qw(:standard);
use CGI::Carp qw(warningsToBrowser fatalsToBrowser);
use strict;

# Set the PATH environment variable to the same path
# where sendmail is located:
$ENV{PATH} = "/usr/sbin";

# open the pipe to sendmail
open (MAIL, "|/usr/sbin/sendmail -oi -t") or 
    &dienice("Can't fork for sendmail: $!\n", "503");

my $name = &veryclean(param('name'));
my $honeypot = param('subject');

# Combat spam bots
if ($honeypot ne "") {
    &dienice("Invalid request (subject)\n", "400");
}

my $message = param('message');
# Combat other annoyances
my $domaincount = () = $message =~ /\bdomain\b/gi;
if ($domaincount > 2) {
    &dienice("Invalid request (domain warning)\n", "400");
}
my $termcount = () = $message =~ /\terminated\b/gi;
if (($domaincount > 0) && ($termcount > 0)) {
    &dienice("Invalid request (domain terminated warning)\n", "400");
}

foreach my $p (param()) {
    if (($p ne "name") && ($p ne "email") && ($p ne "message") && ($p ne "subject")) {
        &dienice("Invalid request\n", "400");
    }
}

my $recipient = 'tom@tomnunes.com';
my $subject = "Subject: TNVO: Contact from visitor\n\n";

if (($name ne "")) {
    $subject = "Subject: TNVO: Contact from $name\n\n";
}

# Start printing the mail headers
# You must specify who it's to, or it won't be delivered:
print MAIL "To: $recipient\n";

print MAIL "From: info\@tomnunes.com\n";

print MAIL "Subject: $subject\n\n";

# Now print the body of your mail message.
foreach my $p (param()) {
    if ((param($p) ne "")) {
        print MAIL "$p: ", &clean(param($p)), "\n\n";
    }
}

# Be sure to close the MAIL input stream so that the
# message actually gets mailed.

close(MAIL);

# print header('text/plain','200 OK');
print header(
  -type => 'text/plain',
  -access_control_allow_origin => '*',
);
print "success";

sub clean
{
	# Clean up any leading and trailing whitespace
	# using regular expressions.
	my $s = shift @_;
	$s =~ s/^\s+//;
	$s =~ s/\s+$//;
	return $s;
}

sub veryclean
{
	# Also forbid newlines by folding all internal whitespace to
	# single spaces. This prevents faking extra headers to cc 
	# extra people.
	my $s = shift @_;
	$s = &clean($s);
	$s =~ s/\s+$/ /g;
	return $s;
}

sub dienice {
    # The dienice subroutine handles errors.
    my($errmsg, $status) = @_;
    print header('text/plain', "$status Not OK");
    print "$status $errmsg";
    exit;
}